import { z } from "zod";
import { ArtifactId, AttachmentId, MessageDraftId, MessageId } from "./ids.js";
import { AttachmentDto } from "./attachment.js";

export const StartConversationUploadInput = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive(),
  threadId: MessageId.nullable().optional(),
});
export type StartConversationUploadInput = z.infer<typeof StartConversationUploadInput>;

export const StartConversationUploadResponse = z.object({
  attachmentId: AttachmentId,
  uploadId: z.string(),
  draftId: MessageDraftId,
});
export type StartConversationUploadResponse = z.infer<typeof StartConversationUploadResponse>;

export const UploadPartQuery = z.object({
  part: z.coerce.number().int().positive(),
});
export type UploadPartQuery = z.infer<typeof UploadPartQuery>;

export const CompleteConversationUploadResponse = z.object({
  attachment: AttachmentDto,
});
export type CompleteConversationUploadResponse = z.infer<typeof CompleteConversationUploadResponse>;

export const ListDraftAttachmentsQuery = z.object({
  threadId: MessageId.nullable().optional(),
});
export type ListDraftAttachmentsQuery = z.infer<typeof ListDraftAttachmentsQuery>;
