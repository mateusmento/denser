import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test, before, after, beforeEach } from "node:test";
import { eq, inArray } from "drizzle-orm";
import type { BlobStore } from "@denser/contracts";
import type {
  ArtifactId,
  AttachmentId,
  MessageDraftId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { db } from "../../db/client.js";
import { attachment } from "../../db/schema/attachment.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { messageDraft } from "../../db/schema/message-draft.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { registerDefaultPorts, registerPort } from "../../ports/index.js";
import { insertAttachmentRow, deleteAttachmentRow } from "./repository.js";
import {
  abortConversationUpload,
  completeConversationUpload,
  resetUploadSessionsForTests,
  startConversationUpload,
  uploadConversationPart,
} from "./upload-service.js";

function makeIds() {
  return {
    userId: randomUUID() as unknown as UserId,
    spaceId: randomUUID() as unknown as SpaceId,
    conversationId: randomUUID() as unknown as ArtifactId,
  };
}

type UploadFixture = {
  userId: UserId;
  spaceId: SpaceId;
  conversationId: ArtifactId;
  attachmentIds: AttachmentId[];
  cleanup: () => Promise<void>;
};

const activeUploads = new Map<
  string,
  { attachmentId: AttachmentId; storageKey: string; draftId?: MessageDraftId }
>();

const blobStore: BlobStore = {
  async createUpload(input) {
    const uploadId = randomUUID();
    const storageKey = `test/${uploadId}`;
    const row = await insertAttachmentRow({
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId ?? null,
      uploadedBy: input.uploadedBy,
      storageKey,
      mimeType: input.mimeType,
      originalFilename: input.filename,
      byteSize: input.byteSize,
    });
    activeUploads.set(uploadId, { attachmentId: row.id, storageKey });
    return { attachmentId: row.id, upload: { uploadId } };
  },
  async uploadPart() {
    return;
  },
  async abortUpload(uploadId) {
    const session = activeUploads.get(uploadId);
    if (!session) return;
    activeUploads.delete(uploadId);
    await deleteAttachmentRow(session.attachmentId).catch(() => undefined);
  },
  async completeUpload(uploadId) {
    const session = activeUploads.get(uploadId);
    if (!session) {
      throw new Error(`No active upload session for uploadId ${uploadId}`);
    }
    activeUploads.delete(uploadId);
    return { storageKey: session.storageKey };
  },
  async getUrl(storageKey) {
    return `https://blob.test/${storageKey}`;
  },
  async deleteObject() {
    return;
  },
};

before(async () => {
  registerDefaultPorts();
  registerPort("blobStore", blobStore);
});

beforeEach(() => {
  resetUploadSessionsForTests();
  activeUploads.clear();
});

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

async function makeUploadFixture(): Promise<UploadFixture> {
  const { userId, spaceId, conversationId } = makeIds();
  const attachmentIds: AttachmentId[] = [];

  await db.insert(userTable).values({
    id: userId,
    name: "Upload Test",
    email: `upload-test-${userId}@denser.test`,
  });

  await db.insert(space).values({
    id: spaceId,
    title: "Upload Test Workspace",
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
    title: "Upload Test Conversation",
    spaceId,
    rootSpaceId: spaceId,
    createdBy: userId,
  });

  const cleanup = async () => {
    if (attachmentIds.length > 0) {
      await db
        .delete(attachment)
        .where(inArray(attachment.id, attachmentIds))
        .catch(() => {});
    }
    await db.delete(messageDraft).where(eq(messageDraft.conversationId, conversationId));
    await db.delete(artifact).where(eq(artifact.id, conversationId));
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, spaceId));
    await db.delete(space).where(eq(space.id, spaceId));
    await db.delete(userTable).where(eq(userTable.id, userId));
  };

  return { userId, spaceId, conversationId, attachmentIds, cleanup };
}

test("start upload ensures draft and syncs attachment join", async () => {
  const f = await makeUploadFixture();
  const { attachmentReferences } = await import("./service.js");
  try {
    const started = await startConversationUpload(f.userId, f.conversationId, {
      filename: "photo.png",
      mimeType: "image/png",
      byteSize: 1024,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    f.attachmentIds.push(started.attachmentId);

    const draftRow = await db.query.messageDraft.findFirst({
      where: eq(messageDraft.id, started.draftId),
    });
    assert.ok(draftRow, "ensureDraft created a draft row");

    const loaded = await attachmentReferences.load({
      type: "draft",
      draftId: started.draftId,
    });
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0]?.id, started.attachmentId);
    assert.equal(loaded[0]?.originalFilename, "photo.png");
    assert.ok(loaded[0]?.url.startsWith("https://blob.test/"));
  } finally {
    await f.cleanup();
  }
});

test("upload part + complete returns attachment on draft anchor", async () => {
  const f = await makeUploadFixture();
  const { attachmentReferences } = await import("./service.js");
  try {
    const started = await startConversationUpload(f.userId, f.conversationId, {
      filename: "notes.txt",
      mimeType: "text/plain",
      byteSize: 12,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    f.attachmentIds.push(started.attachmentId);

    const part = await uploadConversationPart(
      f.userId,
      f.conversationId,
      started.uploadId,
      1,
      new Uint8Array([1, 2, 3, 4]),
    );
    assert.equal(part.ok, true);

    const completed = await completeConversationUpload(
      f.userId,
      f.conversationId,
      started.uploadId,
    );
    assert.equal(completed.ok, true);
    if (!completed.ok) return;
    assert.equal(completed.attachment.id, started.attachmentId);

    const loaded = await attachmentReferences.load({
      type: "draft",
      draftId: started.draftId,
    });
    assert.deepEqual(
      loaded.map((row) => row.id),
      [started.attachmentId],
    );
  } finally {
    await f.cleanup();
  }
});

test("abort removes upload session and drops draft join", async () => {
  const f = await makeUploadFixture();
  const { attachmentReferences } = await import("./service.js");
  try {
    const started = await startConversationUpload(f.userId, f.conversationId, {
      filename: "cancel-me.bin",
      mimeType: "application/octet-stream",
      byteSize: 8,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    const aborted = await abortConversationUpload(
      f.userId,
      f.conversationId,
      started.uploadId,
    );
    assert.equal(aborted.ok, true);

    const loaded = await attachmentReferences.load({
      type: "draft",
      draftId: started.draftId,
    });
    assert.equal(loaded.length, 0);

    const row = await db.query.attachment.findFirst({
      where: eq(attachment.id, started.attachmentId),
    });
    assert.equal(row, undefined);
  } finally {
    await f.cleanup();
  }
});
