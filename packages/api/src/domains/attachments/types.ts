import type { ArtifactId, AttachmentId, SpaceId, UserId } from "@denser/contracts";

export type UploadPartRecord = {
  partNumber: number;
  etag: string;
};

/**
 * Persistence seam for the `attachments` metadata row. Deliberately narrow:
 * the blob adapters seed/remove rows; reference/join logic lives in ticket 17.
 */
export interface AttachRowStore {
  create(input: {
    rootSpaceId: SpaceId;
    conversationId: ArtifactId | null;
    uploadedBy: UserId;
    storageKey: string;
    mimeType: string;
    originalFilename: string;
    byteSize: number;
  }): Promise<{ id: AttachmentId }>;
  deleteById(attachmentId: AttachmentId): Promise<void>;
}
