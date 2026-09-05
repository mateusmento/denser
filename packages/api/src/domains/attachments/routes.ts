import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import {
  ListDraftAttachmentsQuery,
  StartConversationUploadInput,
  UploadPartQuery,
} from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  abortConversationUpload,
  completeConversationUpload,
  listDraftAttachments,
  startConversationUpload,
  uploadConversationPart,
} from "./upload-service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

function parseThreadId(value: string | undefined): MessageId | null {
  return (value as MessageId | undefined) ?? null;
}

export const attachmentRoutes = new Hono<{ Variables: Variables }>()
  .post(
    "/conversations/:conversationId/attachments",
    zValidator("json", StartConversationUploadInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const result = await startConversationUpload(userId, conversationId, c.req.valid("json"));

      if (!result.ok) {
        if (result.reason === "upload_unavailable") {
          return c.json({ error: "Upload storage is not configured" }, 503);
        }
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json(
        {
          attachmentId: result.attachmentId,
          uploadId: result.uploadId,
          draftId: result.draftId,
        },
        201,
      );
    },
  )
  .get(
    "/conversations/:conversationId/attachments",
    zValidator("query", ListDraftAttachmentsQuery),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const threadId = c.req.valid("query").threadId ?? null;
      const result = await listDraftAttachments(userId, conversationId, threadId);

      if (!result.ok) {
        return c.json({ error: "Conversation not found" }, 404);
      }

      return c.json({ attachments: result.attachments });
    },
  )
  .put(
    "/conversations/:conversationId/attachments/:uploadId",
    zValidator("query", UploadPartQuery),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const conversationId = c.req.param("conversationId") as ArtifactId;
      const uploadId = c.req.param("uploadId");
      const { part } = c.req.valid("query");
      const data = new Uint8Array(await c.req.arrayBuffer());

      const result = await uploadConversationPart(
        userId,
        conversationId,
        uploadId,
        part,
        data,
      );

      if (!result.ok) {
        if (result.reason === "invalid_part") {
          return c.json({ error: "Invalid part number" }, 400);
        }
        return c.json({ error: "Upload session not found" }, 404);
      }

      return c.body(null, 204);
    },
  )
  .post("/conversations/:conversationId/attachments/:uploadId/complete", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const uploadId = c.req.param("uploadId");
    const result = await completeConversationUpload(userId, conversationId, uploadId);

    if (!result.ok) {
      return c.json({ error: "Upload session not found" }, 404);
    }

    return c.json({ attachment: result.attachment });
  })
  .delete("/conversations/:conversationId/attachments/:uploadId", async (c) => {
    const userId = c.get("user").id as UserId;
    const conversationId = c.req.param("conversationId") as ArtifactId;
    const uploadId = c.req.param("uploadId");
    const result = await abortConversationUpload(userId, conversationId, uploadId);

    if (!result.ok) {
      return c.json({ error: "Upload session not found" }, 404);
    }

    return c.body(null, 204);
  });
