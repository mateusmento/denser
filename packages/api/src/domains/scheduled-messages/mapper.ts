import type { AttachmentDto, ScheduledMessageDto } from "@denser/contracts";
import type { ScheduledMessageRow } from "./repository.js";

export function toScheduledMessageDto(
  row: ScheduledMessageRow,
  attachments: AttachmentDto[],
): ScheduledMessageDto {
  return {
    ...row,
    attachments,
    lastError: row.lastError,
  };
}
