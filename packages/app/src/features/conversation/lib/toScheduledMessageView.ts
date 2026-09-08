import type { ScheduledMessageDto, ScheduledOutboxItemDto, SessionUser } from "@denser/contracts";
import type { JSONContent } from "@/modules/rich-text";
import { emptyDoc } from "@/modules/rich-text";
import type { ConversationAttachmentView, ScheduledMessageView } from "../types";
import { collectImageAttachmentIdsFromDoc } from "./collect-image-attachment-ids";
import { formatScheduleWallTime, scheduleRecurrenceLabel } from "./formatScheduleWallTime";
import { attachmentViewKind } from "./is-media-mime";

function tileAttachments(
  body: JSONContent,
  dto: ScheduledMessageDto,
): readonly ConversationAttachmentView[] {
  const inlineIds = new Set(collectImageAttachmentIdsFromDoc(body));
  return (dto.attachments ?? [])
    .filter((attachment) => !inlineIds.has(attachment.id))
    .map((attachment) => ({
      id: attachment.id,
      name: attachment.originalFilename,
      mimeType: attachment.mimeType,
      url: attachment.url,
      byteSize: attachment.byteSize,
      kind: attachmentViewKind(attachment.mimeType),
    }));
}

export function toScheduledMessageView(
  job: ScheduledMessageDto,
  currentUser: SessionUser | null,
): ScheduledMessageView {
  const body = job.payload.body as JSONContent;
  const scheduleTz = job.timezone;
  const userTz = currentUser?.timezone ?? null;
  const dueAtLabel = formatScheduleWallTime(job.nextRunAt ?? job.dueAt, scheduleTz);
  const userDueAtLabel =
    userTz && userTz !== scheduleTz
      ? formatScheduleWallTime(job.nextRunAt ?? job.dueAt, userTz)
      : null;

  return {
    id: job.id,
    senderId: job.payload.senderId,
    isMine: currentUser?.id === job.payload.senderId,
    body,
    dueAt: job.dueAt,
    dueAtLabel,
    userDueAtLabel,
    scheduleTimezone: scheduleTz,
    recurrenceLabel: scheduleRecurrenceLabel(job.recurrence),
    threadId: job.payload.threadId ?? null,
    attachments: tileAttachments(body, job),
    processed: job.processed,
  };
}

export function toScheduledMessageViewFromOutboxItem(
  item: ScheduledOutboxItemDto,
  currentUser: SessionUser | null,
): ScheduledMessageView {
  const nextRunAt = item.nextRunAt ?? item.dueAt;
  const scheduleTz = item.timezone;
  const userTz = currentUser?.timezone ?? null;

  return {
    id: item.jobId,
    senderId: currentUser?.id ?? "",
    isMine: true,
    body: emptyDoc(),
    dueAt: nextRunAt,
    dueAtLabel: formatScheduleWallTime(nextRunAt, scheduleTz),
    userDueAtLabel:
      userTz && userTz !== scheduleTz
        ? formatScheduleWallTime(nextRunAt, userTz)
        : null,
    scheduleTimezone: scheduleTz,
    recurrenceLabel: scheduleRecurrenceLabel(item.recurrence),
    threadId: item.threadId,
    attachments: [],
    processed: false,
  };
}
