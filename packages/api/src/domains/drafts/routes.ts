import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import { UpsertMessageDraftInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  deleteMessageDraft,
  getMessageDraft,
  upsertMessageDraft,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

function parseThreadId(value: string | undefined): MessageId | null {
  return (value as MessageId | undefined) ?? null;
}

function parseOptionalVersion(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return parsed;
}

export const draftRoutes = new Hono<{ Variables: Variables }>()
  .get("/conversations/:conversationId/draft", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const threadId = parseThreadId(c.req.query("threadId"));

    const result = await getMessageDraft(userId, conversationId, threadId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ draft: result.draft });
  })
  .put(
    "/conversations/:conversationId/draft",
    zValidator("json", UpsertMessageDraftInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const input = c.req.valid("json");

      if (input.conversationId !== conversationId) {
        return c.json({ error: "conversationId must match the path param" }, 400);
      }

      const result = await upsertMessageDraft(userId, input);

      if ("reason" in result && result.reason === "conflict") {
        return c.json({ error: "conflict" as const, draft: result.draft }, 409);
      }

      if (!result.ok) {
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({ draft: result.draft }, result.created ? 201 : 200);
    },
  )
  .delete("/conversations/:conversationId/draft", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const threadId = parseThreadId(c.req.query("threadId"));
    const version = parseOptionalVersion(c.req.query("version"));

    const result = await deleteMessageDraft(userId, conversationId, threadId, version);

    if ("reason" in result && result.reason === "conflict") {
      return c.json({ error: "conflict" as const, draft: result.draft }, 409);
    }

    if (!result.ok) {
      return c.json({ error: "Draft not found" }, 404);
    }

    return c.body(null, 204);
  });