import type { SpaceId, UserId } from "@denser/contracts";
import { Hono } from "hono";
import {
  countDraftsForUser,
  countScheduledMessagesForUser,
  listDraftsForUser,
  listScheduledMessagesForUser,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const outboxRoutes = new Hono<{ Variables: Variables }>()
  .get("/root-spaces/:rootSpaceId/drafts", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await listDraftsForUser(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ drafts: result.drafts });
  })
  .get("/root-spaces/:rootSpaceId/drafts/count", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await countDraftsForUser(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ count: result.count });
  })
  .get("/root-spaces/:rootSpaceId/scheduled-messages", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await listScheduledMessagesForUser(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ scheduledMessages: result.scheduledMessages });
  })
  .get("/root-spaces/:rootSpaceId/scheduled-messages/count", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await countScheduledMessagesForUser(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ count: result.count });
  });
