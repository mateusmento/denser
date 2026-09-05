import type { AttachmentDto, AttachmentId } from "@denser/contracts";
import type { AttachmentRow } from "./repository.js";

/** Best-effort storage URL via the BlobStore port; falls back to a stable app path
 * before the BlobStore adapter (ticket 16) has landed. Never a vendor URL as the
 * source of truth — the id / storage_key are. */
async function resolveUrl(
  row: AttachmentRow,
  getUrl: (storageKey: string) => Promise<string>,
): Promise<string> {
  try {
    return await getUrl(row.storageKey);
  } catch {
    return `/attachments/${row.id}`;
  }
}

export async function toAttachmentDtos(
  rows: readonly AttachmentRow[],
  getUrl: (storageKey: string) => Promise<string>,
): Promise<AttachmentDto[]> {
  return Promise.all(
    rows.map(async (row): Promise<AttachmentDto> => ({
      id: row.id,
      rootSpaceId: row.rootSpaceId,
      conversationId: row.conversationId ?? undefined,
      uploadedBy: row.uploadedBy,
      mimeType: row.mimeType,
      originalFilename: row.originalFilename,
      byteSize: row.byteSize,
      url: await resolveUrl(row, getUrl),
      createdAt: row.createdAt.toISOString(),
    })),
  );
}

export function toAttachmentIdList(rows: readonly { id: AttachmentId }[]): AttachmentId[] {
  return rows.map((r) => r.id);
}
