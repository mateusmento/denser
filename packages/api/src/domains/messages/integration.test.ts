import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import type { ArtifactId, AttachmentId, ClientId, MessageId, SpaceId, UserId } from "@denser/contracts";
import { db } from "../../db/client.js";
import { attachment, messageAttachment } from "../../db/schema/attachment.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { conversation } from "../../db/schema/conversation.js";
import { message } from "../../db/schema/message.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { registerDefaultPorts, registerPort, type BlobStore } from "../../ports/index.js";
import { requireArtifactAccess } from "../tenancy/access.js";
import { findConversationByArtifactId } from "../conversations/repository.js";
import { loadAuthorDisplay } from "./author-display.js";
import { messageRepository } from "./repository.js";
import { reactionService } from "../reactions/routes.js";
import { pollService } from "../polls/routes.js";
import { createMessageService } from "./service.js";

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
  async deleteObject() {
    return;
  },
};

before(async () => {
  registerDefaultPorts();
  registerPort("blobStore", blobStore);
});

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

async function defaultAccess(userId: UserId, conversationId: ArtifactId) {
  const row = await requireArtifactAccess(userId, conversationId);
  if (!row || row.kind !== "conversation") return null;
  const conversationRow = await findConversationByArtifactId(conversationId);
  if (!conversationRow) return null;
  return { conversationId, rootSpaceId: row.rootSpaceId };
}

async function commitSync(args: {
  conversationId: ArtifactId;
  messageId: MessageId;
  attachmentIds: AttachmentId[];
  actor: { userId: UserId };
}): Promise<void> {
  const { getPort } = await import("../../ports/container.js");
  await getPort("attachmentReferences").commit({
    op: "sync",
    anchor: { type: "message", messageId: args.messageId },
    attachmentIds: args.attachmentIds,
    actor: args.actor,
  });
}

async function commitRelease(args: {
  messageId: MessageId;
  actor: { userId: UserId };
}): Promise<void> {
  const { getPort } = await import("../../ports/container.js");
  await getPort("attachmentReferences").commit({
    op: "release",
    anchor: { type: "message", messageId: args.messageId },
    actor: args.actor,
  });
}

function createTestMessageService() {
  return createMessageService({
    repo: messageRepository,
    access: defaultAccess,
    attachments: {
      commitSync,
      commitRelease,
      async loadByIds(ids) {
        const { loadAttachments } = await import("../attachments/repository.js");
        const { toAttachmentDtos } = await import("../attachments/mapper.js");
        const { getPort } = await import("../../ports/container.js");
        const rows = await loadAttachments(ids);
        return toAttachmentDtos(rows, (key) => getPort("blobStore").getUrl(key));
      },
    },
    reactions: {
      loadForMessages: (messageIds, viewerId) =>
        reactionService.loadAggregatesForMessages(messageIds, viewerId),
    },
    polls: {
      createForMessage: (messageId, input, userId) =>
        pollService.createPollForMessage(messageId, input, userId),
      loadForMessages: (messageIds, viewerId) => pollService.loadForMessages(messageIds, viewerId),
    },
    emit: () => undefined,
    loadAuthorDisplay,
  });
}

type Fixture = {
  userId: UserId;
  spaceId: SpaceId;
  conversationId: ArtifactId;
  attachmentIds: AttachmentId[];
  messageIds: MessageId[];
  cleanup: () => Promise<void>;
};

async function makeFixture(): Promise<Fixture> {
  const userId = randomUUID() as UserId;
  const spaceId = randomUUID() as SpaceId;
  const conversationId = randomUUID() as ArtifactId;
  const attachmentIds: AttachmentId[] = [];
  const messageIds: MessageId[] = [];

  await db.insert(userTable).values({
    id: userId,
    name: "Messages Integration",
    email: `messages-int-${userId}@denser.test`,
  });
  await db.insert(space).values({
    id: spaceId,
    title: "Messages Integration Workspace",
    visibility: "private",
    createdBy: userId,
  });
  await db.insert(spaceMembership).values({ spaceId, userId, role: "owner" });
  await db.insert(artifact).values({
    id: conversationId,
    kind: "conversation",
    title: "Messages Integration Conversation",
    spaceId,
    rootSpaceId: spaceId,
    createdBy: userId,
  });
  await db.insert(conversation).values({
    artifactId: conversationId,
    conversationKind: "regular",
    rootSpaceId: spaceId,
  });

  const cleanup = async () => {
    if (messageIds.length > 0) {
      await db.delete(message).where(inArray(message.id, messageIds)).catch(() => {});
    }
    if (attachmentIds.length > 0) {
      await db.delete(attachment).where(inArray(attachment.id, attachmentIds)).catch(() => {});
    }
    await db.delete(conversation).where(eq(conversation.artifactId, conversationId)).catch(() => {});
    await db.delete(artifact).where(eq(artifact.id, conversationId)).catch(() => {});
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, spaceId)).catch(() => {});
    await db.delete(space).where(eq(space.id, spaceId)).catch(() => {});
    await db.delete(userTable).where(eq(userTable.id, userId)).catch(() => {});
  };

  return { userId, spaceId, conversationId, attachmentIds, messageIds, cleanup };
}

async function insertAttachment(f: Fixture, createdAt = new Date()): Promise<AttachmentId> {
  const id = randomUUID() as AttachmentId;
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

function body(text: string): unknown {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

async function countJoinsForMessage(messageId: MessageId): Promise<number> {
  const rows = await db
    .select({ attachmentId: messageAttachment.attachmentId })
    .from(messageAttachment)
    .where(eq(messageAttachment.messageId, messageId));
  return rows.length;
}

test("deleteMessage releases message attachment joins", async () => {
  const f = await makeFixture();
  try {
    const service = createTestMessageService();
    const fileId = await insertAttachment(f);
    const posted = await service.postMessage(f.userId, {
      conversationId: f.conversationId,
      clientId: randomUUID() as ClientId,
      body: body("with file"),
      attachmentIds: [fileId],
    });
    assert.equal(posted.ok, true);
    if (!posted.ok) return;
    f.messageIds.push(posted.message.id);
    assert.equal(await countJoinsForMessage(posted.message.id), 1);

    const deleted = await service.deleteMessage(f.userId, posted.message.id);
    assert.equal(deleted.ok, true);
    if (!deleted.ok) return;
    assert.ok(deleted.message.deletedAt);
    assert.equal(await countJoinsForMessage(posted.message.id), 0);
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, fileId) })) !== undefined,
      "blob row remains while still referenced or within grace",
    );
  } finally {
    await f.cleanup();
  }
});

test("deleteMessage on one message keeps shared attachment join on another", async () => {
  const f = await makeFixture();
  try {
    const service = createTestMessageService();
    const shared = await insertAttachment(f);

    const first = await service.postMessage(f.userId, {
      conversationId: f.conversationId,
      clientId: randomUUID() as ClientId,
      body: body("first"),
      attachmentIds: [shared],
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    f.messageIds.push(first.message.id);

    const second = await service.postMessage(f.userId, {
      conversationId: f.conversationId,
      clientId: randomUUID() as ClientId,
      body: body("second"),
      attachmentIds: [shared],
    });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    f.messageIds.push(second.message.id);

    assert.equal(await countJoinsForMessage(first.message.id), 1);
    assert.equal(await countJoinsForMessage(second.message.id), 1);

    const deleted = await service.deleteMessage(f.userId, first.message.id);
    assert.equal(deleted.ok, true);
    if (!deleted.ok) return;

    assert.equal(await countJoinsForMessage(first.message.id), 0);
    assert.equal(await countJoinsForMessage(second.message.id), 1);
    assert.ok(
      (await db.query.attachment.findFirst({ where: eq(attachment.id, shared) })) !== undefined,
    );
  } finally {
    await f.cleanup();
  }
});
