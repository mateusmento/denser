import { formatScheduleWallTime as formatScheduleWallTimeUtc } from "@denser/contracts";

export function formatScheduleWallTime(
  isoUtc: string,
  timezone: string | null | undefined,
  locale?: string | string[],
): string {
  return formatScheduleWallTimeUtc(isoUtc, timezone, locale);
}

export function scheduleRecurrenceLabel(
  recurrence: "once" | "daily" | "weekly" | null | undefined,
): string {
  switch (recurrence) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    default:
      return "Once";
  }
}
