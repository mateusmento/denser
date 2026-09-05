import { z } from "zod";
import type { ScheduledJobRecurrence } from "./scheduling-recurrence.js";
export {
  ScheduledJobRecurrenceSchema,
  type ScheduledJobRecurrence,
  type ScheduleRecurrencePreset,
  type ResolveScheduleTimingInput,
  type ResolvedScheduleTiming,
  computeNextRunAt,
  formatScheduleWallTime,
  parseScheduledJobRecurrence,
  recurrenceFromPreset,
  resolveScheduleTiming,
} from "./scheduling-recurrence.js";
import { ArtifactId, MessageId, ScheduledJobId, SpaceId, UserId } from "./ids.js";

export const ScheduledJobIdSchema = ScheduledJobId;
export type { ScheduledJobId };

const ScheduledMessagePayloadSchema = z.object({
  type: z.literal("scheduled_message"),
  conversationId: ArtifactId,
  senderId: UserId,
  body: z.unknown(),
  quotesId: MessageId.nullable().optional(),
  threadId: MessageId.nullable().optional(),
});

const MeetingStartPayloadSchema = z.object({
  type: z.literal("meeting_start"),
  meetingId: z.string().uuid(),
});

const MeetingReminderPayloadSchema = z.object({
  type: z.literal("meeting_reminder"),
  meetingId: z.string().uuid(),
  notifyMinutesBefore: z.number().int().positive(),
});

export const ScheduledJobPayloadSchema = z.discriminatedUnion("type", [
  ScheduledMessagePayloadSchema,
  MeetingStartPayloadSchema,
  MeetingReminderPayloadSchema,
]);
export type ScheduledJobPayload = z.infer<typeof ScheduledJobPayloadSchema>;
export type ScheduledJobType = ScheduledJobPayload["type"];

export type ScheduledJobPayloadByType = {
  scheduled_message: z.infer<typeof ScheduledMessagePayloadSchema>;
  meeting_start: z.infer<typeof MeetingStartPayloadSchema>;
  meeting_reminder: z.infer<typeof MeetingReminderPayloadSchema>;
};

export type ScheduledJobDto<T extends ScheduledJobType = ScheduledJobType> = {
  id: ScheduledJobId;
  rootSpaceId: SpaceId;
  type: T;
  payload: ScheduledJobPayloadByType[T];
  dueAt: string;
  nextRunAt: string;
  timezone?: string | null;
  recurrence?: ScheduledJobRecurrence | null;
  processed: boolean;
  lastOccurrenceAt?: string | null;
};

export type AnyScheduledJobDto = {
  [K in ScheduledJobType]: ScheduledJobDto<K>;
}[ScheduledJobType];

export function parseScheduledJobPayload(
  type: ScheduledJobType,
  raw: unknown,
): ScheduledJobPayloadByType[typeof type] {
  const parsed = ScheduledJobPayloadSchema.parse(
    typeof raw === "object" && raw !== null && "type" in raw ? raw : { type, ...(raw as object) },
  );
  if (parsed.type !== type) {
    throw new Error(`Job type ${type} does not match payload.type ${parsed.type}`);
  }
  return parsed as ScheduledJobPayloadByType[typeof type];
}

export function parseScheduledJobRow(row: {
  id: ScheduledJobId;
  rootSpaceId: SpaceId;
  type: ScheduledJobType;
  payload: unknown;
  dueAt: string;
  nextRunAt: string;
  timezone?: string | null;
  recurrence?: ScheduledJobRecurrence | null;
  processed: boolean;
  lastOccurrenceAt?: string | null;
}): AnyScheduledJobDto {
  const payload = parseScheduledJobPayload(row.type, row.payload);
  return { ...row, payload } as AnyScheduledJobDto;
}

export type CreateScheduledJobBase = {
  rootSpaceId: SpaceId;
  dueAt: string;
  nextRunAt: string;
  timezone?: string | null;
  recurrence?: ScheduledJobRecurrence | null;
};

export function createScheduledMessageJob(
  base: CreateScheduledJobBase,
  input: Omit<z.infer<typeof ScheduledMessagePayloadSchema>, "type">,
): ScheduledJobDto<"scheduled_message"> {
  const payload = ScheduledMessagePayloadSchema.parse({
    type: "scheduled_message",
    ...input,
  });
  return {
    id: "" as ScheduledJobId,
    ...base,
    type: "scheduled_message",
    payload,
    processed: false,
  };
}

export function createMeetingStartJob(
  base: CreateScheduledJobBase,
  input: Omit<z.infer<typeof MeetingStartPayloadSchema>, "type">,
): ScheduledJobDto<"meeting_start"> {
  const payload = MeetingStartPayloadSchema.parse({ type: "meeting_start", ...input });
  return { id: "" as ScheduledJobId, ...base, type: "meeting_start", payload, processed: false };
}

export function createMeetingReminderJob(
  base: CreateScheduledJobBase,
  input: Omit<z.infer<typeof MeetingReminderPayloadSchema>, "type">,
): ScheduledJobDto<"meeting_reminder"> {
  const payload = MeetingReminderPayloadSchema.parse({ type: "meeting_reminder", ...input });
  return {
    id: "" as ScheduledJobId,
    ...base,
    type: "meeting_reminder",
    payload,
    processed: false,
  };
}

export type ScheduledJobOccurrence<T extends ScheduledJobType = ScheduledJobType> =
  ScheduledJobDto<T> & { occurrenceKey: string };

export type ScheduledJobHandler<T extends ScheduledJobType = ScheduledJobType> = (
  job: ScheduledJobOccurrence<T>,
  ctx: { lockId: string },
) => Promise<void>;

export type ScheduledJobHandlerMap = {
  [K in ScheduledJobType]: ScheduledJobHandler<K>;
};

export type ClaimDueJobs = (input: {
  now: Date;
  limit: number;
  staleLockBefore: Date;
}) => Promise<{ lockId: string; jobs: Array<AnyScheduledJobDto & { occurrenceKey: string }> }>;
