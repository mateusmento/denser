import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import { ToggleReactionInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireArtifactAccess } from "../tenancy/access.js";
import { findConversationByArtifactId } from "../conversations/repository.js";
import { emitReactionUpdated } from "../../realtime/emit.js";
import { reactionRepository } from "./repository.js";
import { createReactionService } from "./service.js";

type Variables = { user: { id: string; name: string; email: string } };

async function defaultAccess(userId: UserId, conversationId: ArtifactId) {
  const artifact = await requireArtifactAccess(userId, conversationId);
  if (!artifact || artifact.kind !== "conversation") return false;
  return (await findConversationByArtifactId(conversationId)) != null;
}

const reactionService = createReactionService({ repo: reactionRepository, access: defaultAccess, emit: emitReactionUpdated });

export const reactionRoutes = new Hono<{ Variables: Variables }>().post(
  "/conversations/:conversationId/messages/:messageId/reactions",
  zValidator("json", ToggleReactionInput),
  async (c) => {
    const userId = c.get("user").id as UserId;
    const messageId = c.req.param("messageId") as MessageId;
    const result = await reactionService.toggleReaction(userId, messageId, c.req.valid("json").emoji);
    if (!result.ok) return c.json({ error: "Message not found" }, 404);
    return c.json({ messageId: result.messageId, conversationId: result.conversationId, action: result.action, reactions: result.reactions });
  },
);

export { reactionService };
