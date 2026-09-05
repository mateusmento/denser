import type { MessageDraftDto, AttachmentDto } from "@denser/contracts";
import type { MessageDraftRow } from "./repository.js";

export function toDraftDto(row: MessageDraftRow, attachments: AttachmentDto[]): MessageDraftDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    authorId: row.authorId,
    threadId: row.threadId,
    body: (row.body ?? null) as unknown,
    quotesId: row.quotesId,
    version: row.version,
    expiresAt: row.expiresAt.toISOString(),
    attachments,
  };
}