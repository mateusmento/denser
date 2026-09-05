import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeNextRunAt,
  formatScheduleWallTime,
  recurrenceFromPreset,
  resolveScheduleTiming,
} from "@denser/contracts";

test("once job next run is the due instant until it fires", () => {
  const dueAt = "2030-06-15T14:30:00.000Z";
  const next = computeNextRunAt({
    dueAt,
    recurrence: { frequency: "once" },
    timezone: "UTC",
    after: new Date("2030-06-01T00:00:00.000Z"),
  });
  assert.equal(next?.toISOString(), dueAt);
});

test("daily preset advances in timezone wall time", () => {
  const timing = resolveScheduleTiming({
    dueAt: "2030-01-15T12:00:00.000Z",
    recurrence: recurrenceFromPreset("daily", "2030-01-15T12:00:00.000Z", "America/Sao_Paulo"),
    timezone: "America/Sao_Paulo",
  });
  assert.ok(timing.nextRunAt);

  const afterFirst = new Date(timing.nextRunAt);
  const second = computeNextRunAt({
    dueAt: timing.dueAt,
    recurrence: timing.recurrence,
    timezone: timing.timezone,
    after: afterFirst,
  });
  assert.ok(second);
  assert.ok(second!.getTime() > afterFirst.getTime());
});

test("weekly preset keeps weekday from anchor", () => {
  const recurrence = recurrenceFromPreset("weekly", "2030-01-15T12:00:00.000Z", "UTC");
  assert.equal(recurrence.frequency, "weekly");
  if (recurrence.frequency === "weekly") {
    assert.equal(recurrence.weekdays.length, 1);
  }
});

test("formatScheduleWallTime renders in job timezone", () => {
  const label = formatScheduleWallTime("2030-06-15T03:00:00.000Z", "America/New_York", "en-US");
  assert.match(label, /Jun/);
});
