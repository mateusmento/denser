import type { ScheduledMessageDto, SessionUser } from "@denser/contracts";
import type { JSONContent } from "@/modules/rich-text";
import type { ConversationAttachmentView, ScheduledMessageView } from "../types";
import { collectImageAttachmentIdsFromDoc } from "./collect-image-attachment-ids";
import { isMediaMime } from "./is-media-mime";

function dueAtLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

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
      kind: isMediaMime(attachment.mimeType) ? ("media" as const) : ("file" as const),
    }));
}

export function toScheduledMessageView(
  job: ScheduledMessageDto,
  currentUser: SessionUser | null,
): ScheduledMessageView {
  const body = job.payload.body as JSONContent;
  return {
    id: job.id,
    senderId: job.payload.senderId,
    isMine: currentUser?.id === job.payload.senderId,
    body,
    dueAt: job.dueAt,
    dueAtLabel: dueAtLabel(job.dueAt),
    threadId: job.payload.threadId ?? null,
    attachments: tileAttachments(body, job),
    processed: job.processed,
  };
}
