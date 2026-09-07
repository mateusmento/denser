import type { DraftOutboxItemDto, ScheduledOutboxItemDto } from "@denser/contracts";
import { formatScheduleWallTime, scheduleRecurrenceLabel } from "./formatScheduleWallTime";
import { extractBodyPreview } from "./outbox-preview";
import type { DraftOutboxRowView, ScheduledOutboxRowView, ScheduledMessageView } from "../types";

export function toDraftOutboxRowView(item: DraftOutboxItemDto): DraftOutboxRowView {
  return {
    id: item.id,
    conversationId: item.conversationId,
    threadId: item.threadId,
    conversationLabel: item.conversationLabel ?? "Unavailable conversation",
    contextLabel: item.contextLabel,
    bodyPreview: extractBodyPreview(item.body),
  };
}

export function toScheduledOutboxRowView(item: ScheduledOutboxItemDto): ScheduledOutboxRowView {
  const nextRunAtIso = item.nextRunAt ?? item.dueAt;
  return {
    id: item.jobId,
    conversationId: item.conversationId,
    threadId: item.threadId,
    conversationLabel: item.conversationLabel ?? "Unavailable conversation",
    contextLabel: item.contextLabel,
    bodyPreview: extractBodyPreview(item.body, "Scheduled message"),
    nextRunAtIso,
    timezone: item.timezone,
    recurrenceLabel: scheduleRecurrenceLabel(item.recurrence),
    nextRunWallTimeLabel: formatScheduleWallTime(nextRunAtIso, item.timezone),
  };
}

export function toScheduledOutboxRowViewFromMessageView(
  item: ScheduledMessageView,
  conversationLabel: string,
  conversationId: string,
): ScheduledOutboxRowView {
  return {
    id: item.id,
    conversationId,
    threadId: item.threadId,
    conversationLabel,
    contextLabel: item.threadId ? "thread" : "channel",
    bodyPreview: extractBodyPreview(item.body, "Scheduled message"),
    nextRunAtIso: item.dueAt,
    timezone: item.scheduleTimezone ?? null,
    recurrenceLabel: item.recurrenceLabel ?? "Once",
    nextRunWallTimeLabel: item.dueAtLabel,
  };
}

export function toScheduledOutboxRowViewFromJob(
  job: Parameters<typeof import("./toScheduledMessageView").toScheduledMessageView>[0],
  conversationLabel: string,
): ScheduledOutboxRowView {
  const nextRunAtIso = job.nextRunAt ?? job.dueAt;
  return {
    id: job.id,
    conversationId: job.payload.conversationId,
    threadId: job.payload.threadId ?? null,
    conversationLabel,
    contextLabel: job.payload.threadId ? "thread" : "channel",
    bodyPreview: extractBodyPreview(job.payload.body, "Scheduled message"),
    nextRunAtIso,
    timezone: job.timezone ?? null,
    recurrenceLabel: scheduleRecurrenceLabel(job.recurrence),
    nextRunWallTimeLabel: formatScheduleWallTime(nextRunAtIso, job.timezone),
  };
}
