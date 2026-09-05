import type { ArtifactId, ScheduledJobId, UserId } from "@denser/contracts";
import { ScheduleMessageInput, UpdateScheduledMessageInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  cancelScheduledMessage,
  getScheduledMessage,
  listScheduledMessages,
  scheduleMessage,
  updateScheduledMessage,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const scheduledMessageRoutes = new Hono<{ Variables: Variables }>()
  .post(
    "/conversations/:conversationId/scheduled-messages",
    zValidator("json", ScheduleMessageInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const result = await scheduleMessage(userId, conversationId, c.req.valid("json"));

      if (!result.ok) {
        if (result.reason === "invalid_message" || result.reason === "invalid_thread") {
          return c.json({ error: result.reason }, 400);
        }
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({ scheduledMessage: result.scheduledMessage }, 201);
    },
  )
  .get("/conversations/:conversationId/scheduled-messages", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const result = await listScheduledMessages(userId, conversationId);

    if (!result.ok) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ scheduledMessages: result.scheduledMessages });
  })
  .get("/conversations/:conversationId/scheduled-messages/:scheduledJobId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const scheduledJobId = c.req.param("scheduledJobId") as ScheduledJobId;
    const result = await getScheduledMessage(userId, conversationId, scheduledJobId);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      return c.json({ error: "Scheduled message not found" }, 404);
    }

    return c.json({ scheduledMessage: result.scheduledMessage });
  })
  .patch(
    "/conversations/:conversationId/scheduled-messages/:scheduledJobId",
    zValidator("json", UpdateScheduledMessageInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const scheduledJobId = c.req.param("scheduledJobId") as ScheduledJobId;
      const result = await updateScheduledMessage(
        userId,
        conversationId,
        scheduledJobId,
        c.req.valid("json"),
      );

      if (!result.ok) {
        if (result.reason === "forbidden") {
          return c.json({ error: "Forbidden" }, 403);
        }
        if (result.reason === "invalid_message") {
          return c.json({ error: "invalid_message" }, 400);
        }
        if (result.reason === "processed") {
          return c.json({ error: "already_processed" }, 409);
        }
        return c.json({ error: "Scheduled message not found" }, 404);
      }

      return c.json({ scheduledMessage: result.scheduledMessage });
    },
  )
  .delete("/conversations/:conversationId/scheduled-messages/:scheduledJobId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const scheduledJobId = c.req.param("scheduledJobId") as ScheduledJobId;
    const result = await cancelScheduledMessage(userId, conversationId, scheduledJobId);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      return c.json({ error: "Scheduled message not found" }, 404);
    }

    return c.json({ scheduledMessage: result.scheduledMessage });
  });
