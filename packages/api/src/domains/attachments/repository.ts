import type {
  ArtifactId,
  AttachmentAnchor,
  AttachmentId,
  MessageDraftId,
  MessageId,
  ScheduledJobId,
} from "@denser/contracts";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { attachment, messageAttachment } from "../../db/schema/attachment.js";
import { messageDraft, messageDraftAttachment } from "../../db/schema/message-draft.js";
import { scheduledJob, scheduledJobAttachment } from "../../db/schema/scheduled-job.js";
import { message } from "../../db/schema/message.js";
import type { AnchorScope } from "./rules.js";

export type AttachmentRow = typeof attachment.$inferSelect;

export async function resolveAnchorScope(anchor: AttachmentAnchor): Promise<AnchorScope | null> {
  switch (anchor.type) {
    case "draft": {
      const row = await db.query.messageDraft.findFirst({
        where: eq(messageDraft.id, anchor.draftId),
        columns: { rootSpaceId: true, conversationId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId, conversationId: row.conversationId };
    }
    case "scheduled": {
      const row = await db.query.scheduledJob.findFirst({
        where: eq(scheduledJob.id, anchor.scheduledJobId),
        columns: { rootSpaceId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId };
    }
    case "message": {
      const row = await db.query.message.findFirst({
        where: eq(message.id, anchor.messageId),
        columns: { rootSpaceId: true, conversationId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId ?? "", conversationId: row.conversationId };
    }
  }
}

export async function listAnchorAttachmentIds(anchor: AttachmentAnchor): Promise<AttachmentId[]> {
  const table = joinTable(anchor);
  const rows = await db
    .select({ attachmentId: table.attachmentId })
    .from(table)
    .where(eq(anchorKeyOf(anchor), anchorIdOf(anchor)));
  return rows.map((r) => r.attachmentId);
}

export async function loadAttachments(ids: readonly AttachmentId[]): Promise<AttachmentRow[]> {
  if (ids.length === 0) return [];
  return db.select().from(attachment).where(inArray(attachment.id, ids));
}

export async function loadAttachment(
  attachmentId: AttachmentId,
): Promise<AttachmentRow | undefined> {
  const [row] = await db.select().from(attachment).where(eq(attachment.id, attachmentId)).limit(1);
  return row;
}

export async function listDeliveredForConversationAttachments(
  conversationId: ArtifactId,
): Promise<AttachmentRow[]> {
  const rows = await db
    .select({ attachment })
    .from(messageAttachment)
    .innerJoin(message, eq(message.id, messageAttachment.messageId))
    .innerJoin(attachment, eq(attachment.id, messageAttachment.attachmentId))
    .where(and(eq(message.conversationId, conversationId), isNull(message.deletedAt)));
  return rows.map((r) => r.attachment);
}

// --- helpers ---

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

/** The FK column identifying this anchor's key within its join table. */
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
