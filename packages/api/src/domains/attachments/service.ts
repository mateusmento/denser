import type {
  Actor,
  ArtifactId,
  AttachmentAnchor,
  AttachmentDto,
  AttachmentId,
  AttachmentReferences,
  MessageDraftId,
  MessageId,
  ScheduledJobId,
} from "@denser/contracts";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { attachment, messageAttachment } from "../../db/schema/attachment.js";
import { messageDraftAttachment } from "../../db/schema/message-draft.js";
import { scheduledJobAttachment } from "../../db/schema/scheduled-job.js";
import { getPort } from "../../ports/container.js";
import { toAttachmentDtos } from "./mapper.js";
import * as repo from "./repository.js";
import { computeSyncDelta, isEligibleAttachment, isGcable } from "./rules.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const GRACE_MS = 60 * 60 * 1000;

function defaultGraceBefore(): Date {
  return new Date(Date.now() - GRACE_MS);
}

/**
 * AttachmentReferences (ATTACHMENTS.md A1): workspace blob reference graph.
 *
 * `commit` mutates the join set for one anchor (`sync` exact-set; `release` all;
 * `releaseAttachment` every anchor) and drives GC. GC is **always** a guarded,
 * transactional delete: candidate rows are locked FOR UPDATE and their reference
 * count re-checked before deletion, so a concurrent `sync` that re-references a
 * blob either blocks the delete or is skipped by the waiter. Blobs are only ever
 * deleted when `isGcable` (refcount 0 + past grace + not protected).
 */
class AttachmentReferencesService implements AttachmentReferences {
  async commit(
    input:
      | { op: "sync"; anchor: AttachmentAnchor; attachmentIds: AttachmentId[]; actor: Actor }
      | { op: "release"; anchor: AttachmentAnchor; actor: Actor }
      | { op: "releaseAttachment"; attachmentId: AttachmentId; actor: Actor }
      | { op: "reclaim"; graceBefore: Date },
  ): Promise<void> {
    switch (input.op) {
      case "sync":
        return this.sync(input.anchor, input.attachmentIds, input.actor);
      case "release":
        return this.release(input.anchor);
      case "releaseAttachment":
        return this.releaseAttachment(input.attachmentId, input.actor);
      case "reclaim":
        return this.reclaim(input.graceBefore);
    }
  }

  async load(anchor: AttachmentAnchor): Promise<AttachmentDto[]> {
    const ids = await repo.listAnchorAttachmentIds(anchor);
    const rows = await repo.loadAttachments(ids);
    return toAttachmentDtos(rows, (key) => getPort("blobStore").getUrl(key));
  }

  async listDeliveredForConversation(conversationId: ArtifactId): Promise<AttachmentDto[]> {
    const rows = await repo.listDeliveredForConversationAttachments(conversationId);
    return toAttachmentDtos(rows, (key) => getPort("blobStore").getUrl(key));
  }

  /** Make the anchor's joins exactly `attachmentIds` (subject to eligibility). */
  private async sync(
    anchor: AttachmentAnchor,
    attachmentIds: AttachmentId[],
    actor: Actor,
  ): Promise<void> {
    const scope = await repo.resolveAnchorScope(anchor);
    if (!scope) return;

    const target = await this.filterEligible(attachmentIds, scope, actor);
    const existing = await repo.listAnchorAttachmentIds(anchor);
    const { toAdd, toRemove } = computeSyncDelta(existing, target);

    await db.transaction(async (tx) => {
      if (toAdd.length > 0) {
        // Lock the target rows; one or more may have vanished via concurrent reclaim,
        // in which case we reference only the surviving subset (never a deleted blob).
        const locked = await lockAttachmentRows(tx, toAdd);
        if (locked.length > 0) {
          await tx.insert(joinTable(anchor)).values(locked.map(({ id }) => makeJoin(anchor, id)));
        }
      }
      if (toRemove.length > 0) {
        await tx
          .delete(joinTable(anchor))
          .where(
            and(
              eq(anchorKeyOf(anchor), anchorIdOf(anchor)),
              inArray(joinTable(anchor).attachmentId, toRemove),
            ),
          );
      }
    });

    await this.eagerGcUnreferenced(toRemove, defaultGraceBefore());
  }

  /** Drop every join for this anchor, then eager-GC any now-unreferenced blobs. */
  private async release(anchor: AttachmentAnchor): Promise<void> {
    const ids = await repo.listAnchorAttachmentIds(anchor);
    await db.delete(joinTable(anchor)).where(eq(anchorKeyOf(anchor), anchorIdOf(anchor)));
    await this.eagerGcUnreferenced(ids, defaultGraceBefore());
  }

  /** Drop this attachment from every anchor, then GC it when unreferenced. */
  private async releaseAttachment(attachmentId: AttachmentId, actor: Actor): Promise<void> {
    const row = await repo.loadAttachment(attachmentId);
    if (!row) return;
    if (!actor.trustedDelivery && actor.userId !== row.uploadedBy) {
      return; // eligibility: only the uploader (or a system path) may destroy
    }
    for (const table of [messageAttachment, messageDraftAttachment, scheduledJobAttachment]) {
      await db.delete(table).where(eq(table.attachmentId, attachmentId));
    }
    await this.guardedGc([row], defaultGraceBefore());
  }

  /** Eager GC (after a sync/release) of blobs that are now unreferenced and past grace. */
  private async eagerGcUnreferenced(
    ids: readonly AttachmentId[],
    graceBefore: Date,
  ): Promise<void> {
    if (ids.length === 0) return;
    const rows = await repo.loadAttachments(ids);
    const fastPath = rows.filter((row) => isFastGcable(row, graceBefore));
    // A row may still hold joins (e.g. another anchor); the guarded delete re-counts.
    await this.guardedGc(fastPath, graceBefore);
  }

  /**
   * Hourly GC: delete attachment rows (+ best-effort objects) with zero joins past grace.
   * Race-safe: candidate rows are locked FOR UPDATE and re-checked inside the transaction,
   * so a concurrent `sync` that re-references a blob before commit prevents its deletion.
   */
  private async reclaim(graceBefore: Date): Promise<void> {
    const deletedKeys = await db.transaction(async (tx) => {
      const candidates = await tx
        .select()
        .from(attachment)
        .where(lt(attachment.createdAt, graceBefore))
        .for("update");

      const doomed: Array<{ id: AttachmentId; storageKey: string }> = [];
      for (const row of candidates) {
        const joins = await countJoinsIn(tx, row.id);
        if (
          isGcable({ joinCount: joins, createdAt: row.createdAt, graceBefore, protected: false })
        ) {
          doomed.push({ id: row.id, storageKey: row.storageKey });
        }
      }

      if (doomed.length === 0) return [];
      await tx.delete(attachment).where(
        inArray(
          attachment.id,
          doomed.map((d) => d.id),
        ),
      );
      return doomed.map((d) => d.storageKey);
    });

    await this.bestEffortDeleteObjects(deletedKeys);
  }

  /**
   * Guarded delete shared by every GC path: lock each candidate row, re-count its joins
   * inside the same transaction, and only delete it when it is still gcable. Prevents the
   * classic refcount race where a delete lands between a sync's join insert and commit.
   */
  private async guardedGc(rows: readonly repo.AttachmentRow[], graceBefore: Date): Promise<void> {
    if (rows.length === 0) return;
    const deletedKeys = await db.transaction(async (tx) => {
      const locked = await tx
        .select()
        .from(attachment)
        .where(
          inArray(
            attachment.id,
            rows.map((r) => r.id),
          ),
        )
        .for("update");

      const doomed = locked.filter((row) => {
        const original = rows.find((r) => r.id === row.id);
        if (!original) return false;
        return isGcable({
          joinCount: 0,
          createdAt: original.createdAt,
          graceBefore,
          protected: false,
        });
      });

      if (doomed.length === 0) return [];
      await tx.delete(attachment).where(
        inArray(
          attachment.id,
          doomed.map((d) => d.id),
        ),
      );
      return doomed.map((d) => d.storageKey);
    });

    await this.bestEffortDeleteObjects(deletedKeys);
  }

  private async bestEffortDeleteObjects(keys: readonly string[]): Promise<void> {
    for (const key of keys) {
      try {
        await getPort("blobStore").deleteObject(key);
      } catch {
        // Object deletion is best-effort; the orphan sweep is the safety net.
      }
    }
  }

  private async filterEligible(
    ids: readonly AttachmentId[],
    scope: { rootSpaceId: string; conversationId?: string | null },
    actor: Actor,
  ): Promise<AttachmentId[]> {
    const rows = await repo.loadAttachments(ids);
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.filter((id) => {
      const row = byId.get(id);
      if (!row) return false;
      return isEligibleAttachment({
        attachment: {
          rootSpaceId: row.rootSpaceId,
          conversationId: row.conversationId ?? null,
          uploadedBy: row.uploadedBy,
        },
        scope,
        actorUserId: actor.userId,
        trustedDelivery: actor.trustedDelivery ?? false,
      });
    });
  }
}

/** Fast-path: no joins after our own change — still re-checked under lock before delete. */
function isFastGcable(row: repo.AttachmentRow, graceBefore: Date): boolean {
  return isGcable({ joinCount: 0, createdAt: row.createdAt, graceBefore, protected: false });
}

async function lockAttachmentRows(
  tx: Tx,
  ids: readonly AttachmentId[],
): Promise<Array<{ id: AttachmentId }>> {
  return tx
    .select({ id: attachment.id })
    .from(attachment)
    .where(inArray(attachment.id, ids))
    .for("update");
}

async function countJoinsIn(tx: Tx, attachmentId: AttachmentId): Promise<number> {
  let total = 0;
  for (const table of [messageAttachment, messageDraftAttachment, scheduledJobAttachment]) {
    const rows = await tx
      .select({ id: table.attachmentId })
      .from(table)
      .where(eq(table.attachmentId, attachmentId));
    total += rows.length;
  }
  return total;
}

function joinTable(anchor: AttachmentAnchor) {
  switch (anchor.type) {
    case "draft":
      return messageDraftAttachment;
    case "scheduled":
      return scheduledJobAttachment;
    case "message":
      return messageAttachment;
  }
}

function anchorKeyOf(anchor: AttachmentAnchor) {
  switch (anchor.type) {
    case "draft":
      return messageDraftAttachment.draftId;
    case "scheduled":
      return scheduledJobAttachment.jobId;
    case "message":
      return messageAttachment.messageId;
  }
}

function anchorIdOf(anchor: AttachmentAnchor): MessageDraftId | ScheduledJobId | MessageId {
  switch (anchor.type) {
    case "draft":
      return anchor.draftId;
    case "scheduled":
      return anchor.scheduledJobId;
    case "message":
      return anchor.messageId;
  }
}

function makeJoin(anchor: AttachmentAnchor, attachmentId: AttachmentId) {
  switch (anchor.type) {
    case "draft":
      return { draftId: anchor.draftId, attachmentId };
    case "scheduled":
      return { jobId: anchor.scheduledJobId, attachmentId };
    case "message":
      return { messageId: anchor.messageId, attachmentId };
  }
}

export const attachmentReferences = new AttachmentReferencesService();
