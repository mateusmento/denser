import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import { VotePollInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireArtifactAccess } from "../tenancy/access.js";
import { findConversationByArtifactId } from "../conversations/repository.js";
import { pollRepository } from "./repository.js";
import { createPollService } from "./service.js";
import { emitConversationEvent } from "../../realtime/emit.js";

type Variables = { user: { id: string; name: string; email: string } };

async function defaultAccess(userId: UserId, conversationId: ArtifactId) {
  const artifact = await requireArtifactAccess(userId, conversationId);
  if (!artifact || artifact.kind !== "conversation") return false;
  return (await findConversationByArtifactId(conversationId)) != null;
}

const pollService = createPollService({ repo: pollRepository, access: defaultAccess });

export const pollRoutes = new Hono<{ Variables: Variables }>().post(
  "/conversations/:conversationId/messages/:messageId/poll/vote",
  zValidator("json", VotePollInput),
  async (c) => {
    const userId = c.get("user").id as UserId;
    const messageId = c.req.param("messageId") as MessageId;
    const result = await pollService.votePoll(userId, messageId, c.req.valid("json").optionId);
    if (!result.ok) {
      if (result.reason === "invalid_option") return c.json({ error: "Invalid poll option" }, 400);
      return c.json({ error: "Message not found" }, 404);
    }
    const { messageService } = await import("../messages/routes.js");
    const message = await messageService.getMessage(userId, messageId);
    if (message) emitConversationEvent(result.conversationId, "updated", message);
    return c.json({ messageId: result.messageId, conversationId: result.conversationId, poll: result.poll });
  },
);

export { pollService };
