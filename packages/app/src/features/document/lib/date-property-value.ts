import type { TimeFormat } from "@denser/contracts";
import { CalendarDate, type DateValue } from "@denser/design-system";
import {
  type DateParts,
  type ParsedDatePropertyValue,
  formatDatePropertyDisplay,
  parseDatePropertyValue,
} from "./date-property-display";

export type { DateParts, ParsedDatePropertyValue };
export { formatDatePropertyDisplay, parseDatePropertyValue };

export function serializeDatePropertyValue(
  parsed: ParsedDatePropertyValue,
  timeFormat: TimeFormat,
): string | null {
  if (!parsed.date) return null;

  const datePart = `${String(parsed.date.year).padStart(4, "0")}-${String(parsed.date.month).padStart(2, "0")}-${String(parsed.date.day).padStart(2, "0")}`;

  if (timeFormat === "hidden") return datePart;

  const hour = clamp(parsed.hour, 0, 23);
  const minute = clamp(parsed.minute, 0, 59);
  return `${datePart}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function toCalendarDateValue(date: DateParts | null): DateValue | undefined {
  return date ? new CalendarDate(date.year, date.month, date.day) : undefined;
}

export function fromCalendarDateValue(value: DateValue | undefined): DateParts | null {
  if (!value || !("year" in value)) return null;
  return { year: value.year, month: value.month, day: value.day };
}

export function to12HourParts(hour24: number): { hour12: number; meridiem: "AM" | "PM" } {
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, meridiem };
}

export function from12HourParts(hour12: number, meridiem: "AM" | "PM"): number {
  const normalized = hour12 % 12;
  return meridiem === "PM" ? normalized + 12 : normalized === 0 ? 0 : normalized;
}
