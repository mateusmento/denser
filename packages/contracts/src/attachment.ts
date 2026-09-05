import { z } from "zod";
import {
  ArtifactId,
  AttachmentId,
  MessageDraftId,
  MessageId,
  ScheduledJobId,
  SpaceId,
  UserId,
} from "./ids.js";

export const AttachmentIdSchema = AttachmentId;
export type { AttachmentId };

export const Actor = z.object({
  userId: UserId,
  trustedDelivery: z.boolean().optional(),
});
export type Actor = z.infer<typeof Actor>;

export const AttachmentDto = z.object({
  id: AttachmentId,
  rootSpaceId: SpaceId,
  conversationId: ArtifactId.nullable().optional(),
  uploadedBy: UserId,
  mimeType: z.string(),
  originalFilename: z.string(),
  byteSize: z.number().int().nonnegative(),
  url: z.string(),
  createdAt: z.string(),
});
export type AttachmentDto = z.infer<typeof AttachmentDto>;

export const AttachmentAnchor = z.discriminatedUnion("type", [
  z.object({ type: z.literal("draft"), draftId: MessageDraftId }),
  z.object({ type: z.literal("scheduled"), scheduledJobId: ScheduledJobId }),
  z.object({ type: z.literal("message"), messageId: MessageId }),
]);
export type AttachmentAnchor = z.infer<typeof AttachmentAnchor>;

export type BlobStore = {
  createUpload(input: {
    rootSpaceId: SpaceId;
    uploadedBy: UserId;
    filename: string;
    mimeType: string;
    byteSize: number;
    conversationId?: ArtifactId | null;
  }): Promise<{ attachmentId: AttachmentId; upload: { uploadId: string } }>;
  uploadPart?(input: { uploadId: string; part?: number; data: Uint8Array }): Promise<void>;
  abortUpload(uploadId: string): Promise<void>;
  completeUpload(uploadId: string): Promise<{ storageKey: string }>;
  getUrl(storageKey: string): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
};

export type AttachmentReferences = {
  commit(
    input:
      | { op: "sync"; anchor: AttachmentAnchor; attachmentIds: AttachmentId[]; actor: Actor }
      | { op: "release"; anchor: AttachmentAnchor; actor: Actor }
      | { op: "releaseAttachment"; attachmentId: AttachmentId; actor: Actor }
      | { op: "reclaim"; graceBefore: Date },
  ): Promise<void>;
  load(anchor: AttachmentAnchor): Promise<AttachmentDto[]>;
  listDeliveredForConversation(conversationId: ArtifactId): Promise<AttachmentDto[]>;
};
