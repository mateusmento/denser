import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test, before, after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { attachment } from "../../db/schema/attachment.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { message } from "../../db/schema/message.js";
import { messageDraft } from "../../db/schema/message-draft.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { registerDefaultPorts, registerPort, type BlobStore } from "../../ports/index.js";
import { orphanSweep } from "./orphan-sweep.js";
import type { AttachmentReferences } from "@denser/contracts";
import type {
  ArtifactId,
  AttachmentId,
  MessageDraftId,
  MessageId,
  ScheduledJobId,
  SpaceId,
  UserId,
} from "@denser/contracts";

function makeIds() {
  return {
    userId: randomUUID() as unknown as UserId,
    otherUserId: randomUUID() as unknown as UserId,
    spaceId: randomUUID() as unknown as SpaceId,
    conversationId: randomUUID() as unknown as ArtifactId,
    draftId: randomUUID() as unknown as MessageDraftId,
    messageId: randomUUID() as unknown as MessageId,
    scheduledJobId: randomUUID() as unknown as ScheduledJobId,
  };
}

let references: AttachmentReferences;

const deletedObjectKeys: string[] = [];
const blobStore: BlobStore = {
  async createUpload() {
    throw new Error("not exercised");
  },
  async abortUpload() {
    return;
  },
  async completeUpload() {
    throw new Error("not exercised");
  },
  async getUrl(storageKey) {
    return `https://blob.test/${storageKey}`;
  },
  async deleteObject(storageKey) {
    deletedObjectKeys.push(storageKey);
  },
};

// Register defaults first (they own the `attachmentReferences` seam), then override the
// BlobStore with an in-memory fake so URL resolution and object deletes are observable.
before(async () => {
  await registerDefaultPorts();
  registerPort("blobStore", blobStore);
  ({ attachmentReferences: references } = await import("./service.js"));
});

after(async () => {
  // Close the global pg pool so the test process exits cleanly.
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

// --- fixtures ---

type Fixture = {
  userId: UserId;
  otherUserId: UserId;
  spaceId: SpaceId;
  conversationId: ArtifactId;
  draftId: MessageDraftId;
  messageId: MessageId;
  scheduledJobId: ScheduledJobId;
  attachmentIds: AttachmentId[];
  cleanup: () => Promise<void>;
};

async function makeFixture(): Promise<Fixture> {
  const { userId, otherUserId, spaceId, conversationId, draftId, messageId, scheduledJobId } =
    makeIds();

  await db.insert(userTable).values({
    id: userId,
    name: "Attachment Test",
    email: `attachments-test-${userId}@denser.test`,
  });

  await db.insert(userTable).values({
    id: otherUserId,
    name: "Attachment Test Other",
    email: `attachments-test-other-${otherUserId}@denser.test`,
  });

  await db.insert(space).values({
    id: spaceId,
    title: "Attachment Test Workspace",
    visibility: "private",
    createdBy: userId,
  });

  await db.insert(spaceMembership).values({
    spaceId,
    userId,
    role: "owner",
  });

  await db.insert(artifact).values({
    id: conversationId,
    kind: "conversation",
    title: "Attachment Test Conversation",
    spaceId,
    rootSpaceId: spaceId,
    createdBy: userId,
  });

  await db.insert(messageDraft).values({
    id: draftId,
    rootSpaceId: spaceId,
    conversationId,
    authorId: userId,
    expiresAt: new Date(Date.now() + 60_000),
  });

  await db.insert(message).values({
    id: messageId,
    rootSpaceId: spaceId,
    conversationId,
    authorId: userId,
  });

  await db.insert(scheduledJob).values({
    id: scheduledJobId,
    rootSpaceId: spaceId,
    type: "scheduled_message",
    payload: { type: "scheduled_message", conversationId, senderId: userId, body: null },
    dueAt: new Date(Date.now() + 60_000),
    nextRunAt: new Date(Date.now() + 60_000),
  });

  const attachmentIds: AttachmentId[] = [];
  const cleanup = async () => {
    if (attachmentIds.length > 0) {
      await db
        .delete(attachment)
        .where(inArray(attachment.id, attachmentIds))
        .catch(() => {});
    }
    await db.delete(message).where(eq(message.id, messageId));
    await db.delete(messageDraft).where(eq(messageDraft.id, draftId));
    await db.delete(scheduledJob).where(eq(scheduledJob.id, scheduledJobId));
    await db.delete(artifact).where(eq(artifact.id, conversationId));
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, spaceId));
    await db.delete(space).where(eq(space.id, spaceId));
    await db.delete(userTable).where(inArray(userTable.id, [userId, otherUserId]));
  };

  return {
    userId,
    otherUserId,
    spaceId,
    conversationId,
    draftId,
    messageId,
    scheduledJobId,
    attachmentIds,
    cleanup,
  };
}

async function insertAttachment(
  f: Fixture,
  createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000),
): Promise<AttachmentId> {
  const id = randomUUID() as unknown as AttachmentId;
  await db.insert(attachment).values({
    id,
    rootSpaceId: f.spaceId,
    conversationId: f.conversationId,
    uploadedBy: f.userId,
    storageKey: `test/${id}`,
    mimeType: "text/plain",
    originalFilename: `${id}.txt`,
    byteSize: 4,
    createdAt,
  });
  f.attachmentIds.push(id);
  return id;
}

test("sync sets the exact join set and load returns eligible blobs", async () => {
  const f = await makeFixture();
  try {
    const a = await insertAttachment(f);
    const b = await insertAttachment(f);

    await references.commit({
      op: "sync",
      anchor: { type: "draft", draftId: f.draftId },
      attachmentIds: [a, b],
      actor: { userId: f.userId },
    });

    const loaded = await references.load({ type: "draft", draftId: f.draftId });
    assert.equal(loaded.length, 2);
    assert.deepEqual(loaded.map((d) => d.id).sort(), [a, b].sort());
    assert.ok(loaded.every((d) => d.url.startsWith("https://blob.test/")));

    // Shrink the set to exactly [a].
    await references.commit({
      op: "sync",
      anchor: { type: "draft", draftId: f.draftId },
      attachmentIds: [a],
      actor: { userId: f.userId },
    });
    const afterShrink = await references.load({ type: "draft", draftId: f.draftId });
    assert.deepEqual(
      afterShrink.map((d) => d.id),
      [a],
    );
  } finally {
    await f.cleanup();
  }
});

test("sync ignores non-eligible (non-owner) ids", async () => {
  const f = await makeFixture();
  try {
    const mine = await insertAttachment(f);
    const foreign = randomUUID() as unknown as AttachmentId;
    await db.insert(attachment).values({
      id: foreign,
      rootSpaceId: f.spaceId,
      conversationId: f.conversationId,
      uploadedBy: f.otherUserId,
      storageKey: `test/${foreign}`,
      mimeType: "text/plain",
      originalFilename: `${foreign}.txt`,
      byteSize: 4,
    });
    f.attachmentIds.push(foreign);

    await references.commit({
      op: "sync",
      anchor: { type: "draft", draftId: f.draftId },
      attachmentIds: [mine, foreign],
      actor: { userId: f.userId },
    });

    const loaded = await references.load({ type: "draft", draftId: f.draftId });
    assert.deepEqual(
      loaded.map((d) => d.id),
      [mine],
    );

    // Foreign blob untouched.
    const row = await db.query.attachment.findFirst({ where: eq(attachment.id, foreign) });
    assert.ok(row);
  } finally {
    await f.cleanup();
  }
});

test("release drops joins; referenced blobs survive reclaim; GC respects grace", async () => {
  const f = await makeFixture();
  try {
    const old = await insertAttachment(f, new Date(Date.now() - 3 * 60 * 60 * 1000));
    const recent = await insertAttachment(f, new Date());

    // Reference both on the scheduled anchor (keeps them pinned across release of draft).
    await references.commit({
      op: "sync",
      anchor: { type: "scheduled", scheduledJobId: f.scheduledJobId },
      attachmentIds: [old, recent],
      actor: { userId: f.userId, trustedDelivery: true },
    });

    // A zero-join blob created long ago is reclaimed; referenced ones are not.
    const orphan = await insertAttachment(f, new Date(Date.now() - 5 * 60 * 60 * 1000));
    const deletedBefore = deletedObjectKeys.length;
    await references.commit({ op: "reclaim", graceBefore: new Date(Date.now() - 60 * 60 * 1000) });
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, orphan) })) === undefined,
      "orphan blob reclaimed",
    );
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, old) })) !== undefined,
      "referenced blob preserved",
    );
    assert.ok(deletedObjectKeys.length > deletedBefore, "object delete attempted");

    // Release the scheduled anchor: eager GC removes the old blob (past grace) but not
    // the recent one.
    await references.commit({
      op: "release",
      anchor: { type: "scheduled", scheduledJobId: f.scheduledJobId },
      actor: { userId: f.userId },
    });
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, old) })) === undefined,
      "old unreferenced blob gc'd",
    );
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, recent) })) !== undefined,
      "recent blob within grace kept",
    );

    // A later reclaim with a far future grace collects the recent blob.
    await references.commit({ op: "reclaim", graceBefore: new Date(Date.now() + 60 * 60 * 1000) });
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, recent) })) === undefined,
      "recent blob reclaimed after grace",
    );
  } finally {
    await f.cleanup();
  }
});

test("releaseAttachment strips every anchor and GCs when unreferenced", async () => {
  const f = await makeFixture();
  try {
    const shared = await insertAttachment(f, new Date(Date.now() - 3 * 60 * 60 * 1000));
    await references.commit({
      op: "sync",
      anchor: { type: "draft", draftId: f.draftId },
      attachmentIds: [shared],
      actor: { userId: f.userId },
    });
    await references.commit({
      op: "sync",
      anchor: { type: "message", messageId: f.messageId },
      attachmentIds: [shared],
      actor: { userId: f.userId },
    });

    // Non-owner cannot destroy.
    await references.commit({
      op: "releaseAttachment",
      attachmentId: shared,
      actor: { userId: randomUUID() as unknown as UserId },
    });
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, shared) })) !== undefined,
    );

    // Owner destroy strips all joins and GCs.
    await references.commit({
      op: "releaseAttachment",
      attachmentId: shared,
      actor: { userId: f.userId },
    });
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, shared) })) === undefined,
    );
    assert.equal((await references.load({ type: "draft", draftId: f.draftId })).length, 0);
    assert.equal((await references.load({ type: "message", messageId: f.messageId })).length, 0);
  } finally {
    await f.cleanup();
  }
});

test("orphan sweep deletes keys with no attachment row", async () => {
  const f = await makeFixture();
  try {
    const a = await insertAttachment(f);
    const row = await db.query.attachment.findFirst({
      where: eq(attachment.id, a),
      columns: { storageKey: true },
    });
    assert.ok(row);

    await orphanSweep([row.storageKey, "orphan/never-uploaded"]);
    assert.ok(deletedObjectKeys.includes("orphan/never-uploaded"), "orphan key deleted");
    assert.ok(!deletedObjectKeys.includes(row.storageKey), "key with a row is preserved");
  } finally {
    await f.cleanup();
  }
});

test("concurrent reclaims are idempotent and never delete referenced blobs", async () => {
  const f = await makeFixture();
  try {
    const a = await insertAttachment(f, new Date(Date.now() - 3 * 60 * 60 * 1000));
    const b = await insertAttachment(f, new Date(Date.now() - 3 * 60 * 60 * 1000));

    // Two reclaims racing while both blobs are referenced: nothing is deleted.
    await references.commit({
      op: "sync",
      anchor: { type: "message", messageId: f.messageId },
      attachmentIds: [a, b],
      actor: { userId: f.userId },
    });
    const grace = new Date(Date.now() + 60 * 60 * 1000);
    await Promise.all([
      references.commit({ op: "reclaim", graceBefore: grace }),
      references.commit({ op: "reclaim", graceBefore: grace }),
    ]);
    assert.ok((await db.query.attachment.findFirst({ where: eq(attachment.id, a) })) !== undefined);
    assert.ok((await db.query.attachment.findFirst({ where: eq(attachment.id, b) })) !== undefined);

    // Release makes them unreferenced; racing reclaims both run, exactly one wins the
    // delete, and nothing errors (idempotent).
    await references.commit({
      op: "release",
      anchor: { type: "message", messageId: f.messageId },
      actor: { userId: f.userId },
    });
    await Promise.all([
      references.commit({ op: "reclaim", graceBefore: grace }),
      references.commit({ op: "reclaim", graceBefore: grace }),
    ]);
    assert.ok((await db.query.attachment.findFirst({ where: eq(attachment.id, a) })) === undefined);
    assert.ok((await db.query.attachment.findFirst({ where: eq(attachment.id, b) })) === undefined);

    // A blob re-referenced by a sync between releases survives the next reclaim.
    const c = await insertAttachment(f, new Date(Date.now() - 3 * 60 * 60 * 1000));
    await references.commit({
      op: "sync",
      anchor: { type: "draft", draftId: f.draftId },
      attachmentIds: [c],
      actor: { userId: f.userId },
    });
    await references.commit({ op: "reclaim", graceBefore: grace });
    assert.ok((await db.query.attachment.findFirst({ where: eq(attachment.id, c) })) !== undefined);
  } finally {
    await f.cleanup();
  }
});
