import {
  computeNextRunAt,
  recurrenceFromPreset,
  type ScheduleRecurrencePreset,
} from "@denser/contracts";
import { formatScheduleWallTime } from "./formatScheduleWallTime";

export type ScheduleMatrixMember = {
  userId: string;
  name: string;
  timezone: string | null;
};

export type ScheduleMatrixRow = {
  userId: string;
  name: string;
  times: readonly string[];
};

const MAX_MATRIX_ROWS = 8;
const MAX_OTHERS = 7;

export function buildScheduleMemberMatrix(input: {
  schedulerUserId: string;
  members: readonly ScheduleMatrixMember[];
  dueAtIso: string;
  recurrence: ScheduleRecurrencePreset;
  weekdays?: number[];
  until?: string | null;
  scheduleTimezone: string;
}): { rows: readonly ScheduleMatrixRow[]; overflowCount: number } {
  const recurrence = recurrenceFromPreset(
    input.recurrence,
    input.dueAtIso,
    input.scheduleTimezone,
    {
      ...(input.weekdays ? { weekdays: input.weekdays } : {}),
      ...(input.until ? { until: input.until } : {}),
    },
  );

  const fireCount = input.recurrence === "once" ? 1 : 3;
  const fires: Date[] = [];
  let after: Date | null = null;
  for (let i = 0; i < fireCount; i += 1) {
    const next = computeNextRunAt({
      dueAt: input.dueAtIso,
      recurrence,
      timezone: input.scheduleTimezone,
      after,
    });
    if (!next) break;
    fires.push(next);
    after = next;
  }

  const sorted = [...input.members].sort((a, b) => a.name.localeCompare(b.name));
  const scheduler = sorted.find((member) => member.userId === input.schedulerUserId);
  const others = sorted.filter((member) => member.userId !== input.schedulerUserId);
  const capped = [
    ...(scheduler ? [scheduler] : []),
    ...others.slice(0, scheduler ? MAX_OTHERS : MAX_MATRIX_ROWS),
  ];
  const overflowCount = Math.max(0, input.members.length - capped.length);

  const rows = capped.map((member) => ({
    userId: member.userId,
    name: member.name,
    times: fires.map((fire) =>
      formatScheduleWallTime(
        fire.toISOString(),
        member.timezone ?? input.scheduleTimezone,
      ),
    ),
  }));

  return { rows, overflowCount };
}
