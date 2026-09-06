import { z } from "zod";

const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const ScheduledJobRecurrenceOnceSchema = z.object({
  frequency: z.literal("once"),
});

export const ScheduledJobRecurrenceDailySchema = z.object({
  frequency: z.literal("daily"),
  interval: z.number().int().positive().optional(),
  timeOfDay: timeOfDaySchema,
  until: z.string().datetime().optional(),
});

export const ScheduledJobRecurrenceWeeklySchema = z.object({
  frequency: z.literal("weekly"),
  interval: z.number().int().positive().optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  timeOfDay: timeOfDaySchema,
  until: z.string().datetime().optional(),
});

export const ScheduledJobRecurrenceSchema = z.discriminatedUnion("frequency", [
  ScheduledJobRecurrenceOnceSchema,
  ScheduledJobRecurrenceDailySchema,
  ScheduledJobRecurrenceWeeklySchema,
]);

export type ScheduledJobRecurrence = z.infer<typeof ScheduledJobRecurrenceSchema>;
export type ScheduleRecurrencePreset = ScheduledJobRecurrence["frequency"];

export type ResolveScheduleTimingInput = {
  dueAt: string;
  recurrence: ScheduledJobRecurrence | null | undefined;
  timezone: string | null | undefined;
  /** When advancing a series, find the next slot strictly after this instant. */
  after?: string | null;
};

export type ResolvedScheduleTiming = {
  dueAt: string;
  nextRunAt: string;
  timezone: string | null;
  recurrence: ScheduledJobRecurrence | null;
};

export function parseScheduledJobRecurrence(raw: unknown): ScheduledJobRecurrence | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  return ScheduledJobRecurrenceSchema.parse(raw);
}

export function recurrenceFromPreset(
  preset: ScheduleRecurrencePreset,
  dueAtUtc: string,
  timezone: string,
): ScheduledJobRecurrence {
  if (preset === "once") {
    return { frequency: "once" };
  }
  const timeOfDay = deriveTimeOfDayInZone(dueAtUtc, timezone);
  if (preset === "daily") {
    return { frequency: "daily", interval: 1, timeOfDay };
  }
  const weekday = deriveWeekdayInZone(dueAtUtc, timezone);
  return { frequency: "weekly", interval: 1, timeOfDay, weekdays: [weekday] };
}

export function resolveScheduleTiming(input: ResolveScheduleTimingInput): ResolvedScheduleTiming {
  const timezone = input.timezone?.trim() || null;
  const recurrence = normalizeRecurrence(input.recurrence, input.dueAt, timezone);
  const dueAt = input.dueAt;
  const after = input.after ? new Date(input.after) : null;
  const next = computeNextRunAt({ dueAt, recurrence, timezone, after });
  if (!next) {
    throw new Error("Schedule has no upcoming run");
  }
  return { dueAt, nextRunAt: next.toISOString(), timezone, recurrence };
}

export function computeNextRunAt(input: {
  dueAt: string;
  recurrence: ScheduledJobRecurrence | null | undefined;
  timezone: string | null | undefined;
  after?: Date | null;
}): Date | null {
  const recurrence = normalizeRecurrence(input.recurrence, input.dueAt, input.timezone);
  const zone = input.timezone?.trim() || "UTC";
  const dueAt = new Date(input.dueAt);
  const after = input.after ?? new Date(0);

  if (recurrence.frequency === "once") {
    if (dueAt.getTime() <= after.getTime()) {
      return null;
    }
    return dueAt;
  }

  const interval = recurrence.interval ?? 1;
  const [hour, minute] = parseTimeOfDay(recurrence.timeOfDay);
  const until = recurrence.until ? new Date(recurrence.until) : null;

  if (recurrence.frequency === "daily") {
    let cursor = startOfZonedDay(dueAt, zone);
    for (let guard = 0; guard < 10_000; guard += 1) {
      const candidate = zonedWallTimeToUtc(
        cursor.year,
        cursor.month,
        cursor.day,
        hour,
        minute,
        zone,
      );
      if (candidate.getTime() > after.getTime()) {
        if (until && candidate.getTime() > until.getTime()) {
          return null;
        }
        return candidate;
      }
      cursor = addZonedDays(cursor, interval, zone);
    }
    return null;
  }

  const weekdays = [...recurrence.weekdays].sort((a, b) => a - b);
  let cursor = startOfZonedDay(dueAt, zone);
  for (let guard = 0; guard < 10_000; guard += 1) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const day = addZonedDays(cursor, dayOffset, zone);
      const weekday = zonedWeekday(day, zone);
      if (!weekdays.includes(weekday)) {
        continue;
      }
      const candidate = zonedWallTimeToUtc(day.year, day.month, day.day, hour, minute, zone);
      if (candidate.getTime() <= after.getTime()) {
        continue;
      }
      if (until && candidate.getTime() > until.getTime()) {
        return null;
      }
      return candidate;
    }
    cursor = addZonedDays(cursor, 7 * interval, zone);
  }
  return null;
}

/** Format a UTC instant as wall time in the job timezone (for schedule lists). */
export function formatScheduleWallTime(
  isoUtc: string,
  timezone: string | null | undefined,
  locale?: string | string[],
): string {
  const zone = timezone?.trim() || undefined;
  return new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoUtc));
}

function normalizeRecurrence(
  recurrence: ScheduledJobRecurrence | null | undefined,
  dueAt: string,
  timezone: string | null | undefined,
): ScheduledJobRecurrence {
  if (!recurrence || recurrence.frequency === "once") {
    return { frequency: "once" };
  }
  const zone = timezone?.trim() || "UTC";
  if (recurrence.frequency === "daily") {
    return {
      frequency: "daily",
      interval: recurrence.interval ?? 1,
      timeOfDay: recurrence.timeOfDay ?? deriveTimeOfDayInZone(dueAt, zone),
      until: recurrence.until,
    };
  }
  return {
    frequency: "weekly",
    interval: recurrence.interval ?? 1,
    timeOfDay: recurrence.timeOfDay ?? deriveTimeOfDayInZone(dueAt, zone),
    weekdays:
      recurrence.weekdays.length > 0
        ? recurrence.weekdays
        : [deriveWeekdayInZone(dueAt, zone)],
    until: recurrence.until,
  };
}

function parseTimeOfDay(value: string): [number, number] {
  const [h, m] = value.split(":");
  return [Number(h), Number(m ?? 0)];
}

type ZonedYmd = { year: number; month: number; day: number };

function deriveTimeOfDayInZone(isoUtc: string, timezone: string): string {
  const parts = getZonedParts(new Date(isoUtc), timezone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

function deriveWeekdayInZone(isoUtc: string, timezone: string): number {
  return zonedWeekday(startOfZonedDay(new Date(isoUtc), timezone), timezone);
}

function zonedWeekday(ymd: ZonedYmd, timezone: string): number {
  const noon = zonedWallTimeToUtc(ymd.year, ymd.month, ymd.day, 12, 0, timezone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" })
    .formatToParts(noon)
    .find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday ?? "Sun"] ?? 0;
}

function startOfZonedDay(instant: Date, timezone: string): ZonedYmd {
  const parts = getZonedParts(instant, timezone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function addZonedDays(ymd: ZonedYmd, days: number, timezone: string): ZonedYmd {
  const utc = zonedWallTimeToUtc(ymd.year, ymd.month, ymd.day, 12, 0, timezone);
  utc.setUTCDate(utc.getUTCDate() + days);
  return startOfZonedDay(utc, timezone);
}

function getZonedParts(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const offset = getTimeZoneOffsetMs(new Date(utcMs), timeZone);
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offset;
  }
  return new Date(utcMs);
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = getZonedParts(instant, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - instant.getTime();
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
