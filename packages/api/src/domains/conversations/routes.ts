import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import {
  CreateConversationInput,
  CreateDirectConversationInput,
  PatchConversationInput,
} from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createConversation,
  createOrOpenDirectConversation,
  deleteConversation,
  getConversation,
  hideDirectConversation,
  listDirectConversations,
  patchConversation,
  unhideDirectConversation,
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
  .get("/root-spaces/:rootSpaceId/direct-conversations", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await listDirectConversations(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ conversations: result.conversations });
  })
  .post("/direct-conversations", zValidator("json", CreateDirectConversationInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const result = await createOrOpenDirectConversation(userId, c.req.valid("json"));

    if (result.reason === "invalid_members" || result.reason === "user_not_found") {
      return c.json(
        {
          error:
            result.reason === "user_not_found"
              ? "User not found"
              : "Participants must belong to this workspace",
        },
        400,
      );
    }

    if (!result.ok) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      { conversation: result.conversation, created: result.created },
      result.created ? 201 : 200,
    );
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
  .patch(
    "/conversations/:conversationId",
    zValidator("json", PatchConversationInput),
    async (c) => {
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
    },
  )
  .delete("/conversations/:conversationId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await deleteConversation(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.body(null, 204);
  })
  .post("/conversations/:conversationId/hide", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await hideDirectConversation(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ conversationId, hidden: result.hidden });
  })
  .post("/conversations/:conversationId/unhide", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await unhideDirectConversation(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ conversationId, hidden: result.hidden });
  });
