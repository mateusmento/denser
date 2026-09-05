import type { AttachmentDto, AttachmentId, MessageDto, QuotedPreviewDto, ReactionAggregateDto, PollDto } from "@denser/contracts";
import type { MessageRow } from "./types.js";

export function toMessageDto(
  row: MessageRow,
  attachmentIds: AttachmentId[],
  extra?: {
    wasScheduled?: boolean;
    quoted?: QuotedPreviewDto | null;
    attachments?: AttachmentDto[];
    reactions?: ReactionAggregateDto[];
    poll?: PollDto;
  },
): MessageDto {
  return {
    id: row.id,
    conversationId: row.conversationId,
    threadId: row.threadId,
    quotesId: row.quotesId,
    authorId: row.authorId,
    body: row.body,
    clientId: row.clientId,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    attachmentIds,
    ...(extra?.attachments !== undefined ? { attachments: extra.attachments } : {}),
    ...(extra?.quoted !== undefined ? { quoted: extra.quoted } : {}),
    ...(extra?.wasScheduled !== undefined ? { wasScheduled: extra.wasScheduled } : {}),
    ...(extra?.reactions !== undefined ? { reactions: extra.reactions } : {}),
    ...(extra?.poll !== undefined ? { poll: extra.poll } : {}),
  };
}
