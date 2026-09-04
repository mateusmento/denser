import type { DateFormat, DatePropertyDefinition, TimeFormat } from "@denser/contracts";

export type DateParts = { year: number; month: number; day: number };

export type ParsedDatePropertyValue = {
  date: DateParts | null;
  hour: number;
  minute: number;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

export function parseDatePropertyValue(value: unknown): ParsedDatePropertyValue {
  if (typeof value !== "string" || !value) {
    return { date: null, hour: 9, minute: 0 };
  }

  const datetimeMatch = value.match(ISO_DATETIME);
  if (datetimeMatch) {
    const [, year, month, day, hour, minute] = datetimeMatch;
    return {
      date: { year: Number(year), month: Number(month), day: Number(day) },
      hour: Number(hour),
      minute: Number(minute),
    };
  }

  const dateMatch = value.match(ISO_DATE);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return {
      date: { year: Number(year), month: Number(month), day: Number(day) },
      hour: 9,
      minute: 0,
    };
  }

  return { date: null, hour: 9, minute: 0 };
}

export function formatDatePropertyDisplay(
  value: unknown,
  prop: Pick<DatePropertyDefinition, "dateFormat" | "timeFormat">,
): string {
  const parsed = parseDatePropertyValue(value);
  if (!parsed.date) return "—";

  const jsDate = new Date(
    parsed.date.year,
    parsed.date.month - 1,
    parsed.date.day,
    parsed.hour,
    parsed.minute,
  );

  if (prop.dateFormat === "relative") {
    return formatRelative(jsDate);
  }

  const dateText = formatDateByPattern(jsDate, prop.dateFormat);
  if (prop.timeFormat === "hidden") return dateText;

  const timeText = formatTime(jsDate, prop.timeFormat);
  return `${dateText} ${timeText}`;
}

function formatDateByPattern(date: Date, format: DateFormat): string {
  switch (format) {
    case "short_date":
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    case "mdy":
      return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
    case "dmy":
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" });
    case "ymd":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    case "full_date":
    default:
      return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }
}

function formatTime(date: Date, timeFormat: TimeFormat): string {
  if (timeFormat === "24h") {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffDays = Math.round((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  if (Math.abs(diffDays) < 28) return rtf.format(Math.round(diffDays / 7), "week");
  return formatDateByPattern(date, "full_date");
}
