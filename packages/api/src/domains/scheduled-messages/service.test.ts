import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, ScheduledJobId, SpaceId, UserId } from "@denser/contracts";
import { createScheduledMessageJob } from "@denser/contracts";
import { isOnceJob } from "./recurrence.js";

test("isOnceJob treats null recurrence as once", () => {
  assert.equal(isOnceJob({ recurrence: null }), true);
  assert.equal(isOnceJob({ recurrence: { frequency: "once" } }), true);
  assert.equal(isOnceJob({ recurrence: { frequency: "daily", timeOfDay: "09:00" } }), false);
});

test("createScheduledMessageJob factory matches row type", () => {
  const job = createScheduledMessageJob(
    {
      rootSpaceId: "00000000-0000-4000-8000-000000000001" as SpaceId,
      dueAt: "2030-01-01T12:00:00.000Z",
      nextRunAt: "2030-01-01T12:00:00.000Z",
    },
    {
      conversationId: "00000000-0000-4000-8000-000000000002" as ArtifactId,
      senderId: "00000000-0000-4000-8000-000000000003" as UserId,
      body: { type: "doc", content: [] },
    },
  );
  assert.equal(job.type, "scheduled_message");
  assert.equal(job.payload.type, "scheduled_message");
  assert.equal(job.id, "" as ScheduledJobId);
});
