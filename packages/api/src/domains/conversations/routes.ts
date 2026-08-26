import type { ArtifactId, UserId } from "@denser/contracts";
import { CreateConversationInput, PatchConversationInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createConversation,
  deleteConversation,
  getConversation,
  patchConversation,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const conversationRoutes = new Hono<{ Variables: Variables }>()
  .post("/conversations", zValidator("json", CreateConversationInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const result = await createConversation(userId, c.req.valid("json"));

    if (!result.ok) {
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({ conversation: result.conversation }, 201);
  })
  .get("/conversations/:conversationId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await getConversation(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ conversation: result.conversation });
  })
  .patch("/conversations/:conversationId", zValidator("json", PatchConversationInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await patchConversation(userId, conversationId, c.req.valid("json"));

    if (result.reason === "conflict") {
      return c.json({ error: "conflict" as const, conversation: result.conversation }, 409);
    }

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ conversation: result.conversation });
  })
  .delete("/conversations/:conversationId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await deleteConversation(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.body(null, 204);
  });
