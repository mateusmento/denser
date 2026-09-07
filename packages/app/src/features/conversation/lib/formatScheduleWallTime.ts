import {
  formatScheduleWallTime as formatScheduleWallTimeUtc,
  type ScheduledJobRecurrence,
} from "@denser/contracts";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatScheduleWallTime(
  isoUtc: string,
  timezone: string | null | undefined,
  locale?: string | string[],
): string {
  return formatScheduleWallTimeUtc(isoUtc, timezone, locale);
}

export function scheduleRecurrenceLabel(
  recurrence: ScheduledJobRecurrence | null | undefined,
): string {
  if (!recurrence || recurrence.frequency === "once") return "Once";
  if (recurrence.frequency === "daily") {
    return recurrence.until ? `Daily · until ${formatUntil(recurrence.until)}` : "Daily";
  }
  const days = recurrence.weekdays.map((day) => WEEKDAY_LABELS[day] ?? "?").join(", ");
  const base = `Weekly · ${days}`;
  return recurrence.until ? `${base} · until ${formatUntil(recurrence.until)}` : base;
}

function formatUntil(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
}
