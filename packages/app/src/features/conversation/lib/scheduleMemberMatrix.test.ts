import assert from "node:assert/strict";
import test from "node:test";
import { buildScheduleMemberMatrix } from "./scheduleMemberMatrix.ts";

test("buildScheduleMemberMatrix caps roster at 8 with overflow", () => {
  const members = Array.from({ length: 12 }, (_, index) => ({
    userId: `user-${index}`,
    name: `Member ${String(index).padStart(2, "0")}`,
    timezone: "UTC",
  }));

  const result = buildScheduleMemberMatrix({
    schedulerUserId: "user-5",
    members,
    dueAtIso: "2026-09-10T12:00:00.000Z",
    recurrence: "once",
    scheduleTimezone: "UTC",
  });

  assert.equal(result.rows.length, 8);
  assert.equal(result.overflowCount, 4);
  assert.equal(result.rows[0]?.userId, "user-5");
});

test("buildScheduleMemberMatrix returns three fires for weekly recurrence", () => {
  const result = buildScheduleMemberMatrix({
    schedulerUserId: "alice",
    members: [{ userId: "alice", name: "Alice", timezone: "UTC" }],
    dueAtIso: "2026-09-10T12:00:00.000Z",
    recurrence: "weekly",
    weekdays: [3],
    scheduleTimezone: "UTC",
  });

  assert.equal(result.rows[0]?.times.length, 3);
});
