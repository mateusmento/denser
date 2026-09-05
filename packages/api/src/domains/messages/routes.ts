import type { ArtifactId, AttachmentId, MessageId, UserId } from "@denser/contracts";
import { EditMessageInput, ListMessagesQuery, PostMessageInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireArtifactAccess } from "../tenancy/access.js";
import { findConversationByArtifactId } from "../conversations/repository.js";
import { emitConversationEvent } from "../../realtime/emit.js";
import { messageRepository } from "./repository.js";
import { createMessageService, type MessageServiceDeps } from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const messageRoutes = new Hono<{ Variables: Variables }>()
  .get(
    "/conversations/:conversationId/messages",
    zValidator("query", ListMessagesQuery.pick({ size: true, cursor: true, direction: true, around: true })),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const result = await defaultMessageService.listMessagesForConversation(userId, {
        conversationId,
        ...c.req.valid("query"),
      });

      if (!result.ok) {
        if (result.reason === "invalid_cursor") {
          return c.json({ error: "Invalid cursor" }, 400);
        }
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({
        messages: result.messages,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
      });
    },
  )
  .post(
    "/conversations/:conversationId/messages",
    zValidator("json", PostMessageInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const result = await defaultMessageService.postMessage(userId, {
        ...c.req.valid("json"),
        conversationId,
      });

      if (!result.ok) {
        if (result.reason === "invalid_message") {
          return c.json({ error: "Message body or attachment is required" }, 400);
        }
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({ message: result.message }, 201);
    },
  )
  .patch(
    "/conversations/:conversationId/messages/:messageId",
    zValidator("json", EditMessageInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const messageId = c.req.param("messageId") as MessageId;
      const result = await defaultMessageService.editMessage(
        userId,
        messageId,
        c.req.valid("json").body,
      );

      if (!result.ok) {
        if (result.reason === "forbidden") {
          return c.json({ error: "Forbidden" }, 403);
        }
        return c.json({ error: "Message not found" }, 404);
      }

      return c.json({ message: result.message });
    },
  )
  .delete(
    "/conversations/:conversationId/messages/:messageId",
    async (c) => {
      const userId = c.get("user").id as UserId;
      const messageId = c.req.param("messageId") as MessageId;
      const result = await defaultMessageService.deleteMessage(userId, messageId);

      if (!result.ok) {
        if (result.reason === "forbidden") {
          return c.json({ error: "Forbidden" }, 403);
        }
        return c.json({ error: "Message not found" }, 404);
      }

      return c.json({ message: result.message });
    },
  );

async function defaultAccess(userId: UserId, conversationId: ArtifactId) {
  const artifact = await requireArtifactAccess(userId, conversationId);
  if (!artifact || artifact.kind !== "conversation") return null;
  const conversationRow = await findConversationByArtifactId(conversationId);
  if (!conversationRow) return null;
  return { conversationId, rootSpaceId: artifact.rootSpaceId };
}

async function commitSync(
  args: {
    conversationId: ArtifactId;
    messageId: MessageId;
    attachmentIds: AttachmentId[];
    actor: { userId: UserId };
  },
): Promise<void> {
  const { getPort } = await import("../../ports/container.js");
  await getPort("attachmentReferences").commit({
    op: "sync",
    anchor: { type: "message", messageId: args.messageId },
    attachmentIds: args.attachmentIds,
    actor: args.actor,
  });
}

const messageDeps: MessageServiceDeps = {
  repo: messageRepository,
  access: defaultAccess,
  attachments: {
    commitSync,
  },
  emit: (conversationId, event, message) => emitConversationEvent(conversationId, event, message),
};

const defaultMessageService = createMessageService(messageDeps);