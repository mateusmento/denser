import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { MessageId } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  getConversationUnread,
  getUnreadSummary,
  markConversationRead,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const readStateRoutes = new Hono<{ Variables: Variables }>()
  .post(
    "/conversations/:conversationId/read",
    zValidator("json", z.object({ messageId: MessageId.optional() })),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const body = c.req.valid("json");

      const result = await markConversationRead(userId, conversationId, body.messageId);

      if (result.reason === "invalid_message") {
        return c.json({ error: "Message not found" }, 400);
      }

      if (!result.ok) {
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({ readState: result.readState });
    },
  )
  .get("/conversations/:conversationId/unread", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await getConversationUnread(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ summary: result.summary });
  })
  .get("/root-spaces/:rootSpaceId/unread-summary", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await getUnreadSummary(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ conversations: result.conversations });
  });
