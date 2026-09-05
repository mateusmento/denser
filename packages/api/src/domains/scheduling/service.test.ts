import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  createMeetingStartJob,
  createScheduledMessageJob,
  SEED_ARTIFACT_CHAN_GENERAL,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
  type ScheduledJobId,
} from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";
import { createJob, registerHandler, runScheduleTick } from "./service.js";

function jobFixture() {
  const dueAt = new Date("2020-01-01T00:00:00.000Z");
  return createScheduledMessageJob(
    { rootSpaceId: SEED_SPACE_ACME, dueAt: dueAt.toISOString(), nextRunAt: dueAt.toISOString() },
    {
      conversationId: SEED_ARTIFACT_CHAN_GENERAL,
      senderId: SEED_USER_ALICE,
      body: { type: "doc", content: [] },
    },
  );
}

async function deleteJob(id: ScheduledJobId): Promise<void> {
  await db.delete(scheduledJob).where(eq(scheduledJob.id, id));
}

test("runScheduleTick dispatches a due job through its handler and marks it processed", async () => {
  const id = await createJob(jobFixture());
  const calls: string[] = [];
  registerHandler("scheduled_message", async (job, ctx) => {
    calls.push(`${ctx.lockId}:${job.occurrenceKey}`);
  });

  try {
    const processed = await runScheduleTick({ limit: 1 });
    assert.equal(processed, 1);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!, new RegExp(`:${id}:2020-01-01T00:00:00.000Z$`));

    const row = await db.query.scheduledJob.findFirst({ where: eq(scheduledJob.id, id) });
    assert.equal(row?.processed, true);
    assert.equal(row?.lockId, null);
    assert.equal(row?.retryCount, 0);
  } finally {
    await deleteJob(id);
  }
});

test("an unknown handler type falls back to the noop logger", async () => {
  const dueAt = new Date("2020-01-01T00:00:00.000Z");
  const meetingJob = createMeetingStartJob(
    { rootSpaceId: SEED_SPACE_ACME, dueAt: dueAt.toISOString(), nextRunAt: dueAt.toISOString() },
    { meetingId: randomUUID() },
  );
  const meetingJobId = await createJob(meetingJob);
  const id = await createJob(jobFixture());
  const calls: string[] = [];
  registerHandler("scheduled_message", async (job, ctx) => {
    calls.push(ctx.lockId);
  });

  try {
    const processed = await runScheduleTick({ limit: 10 });
    assert.equal(processed, 2);
    assert.equal(calls.length, 1, "only scheduled_message runs the registered handler");
  } finally {
    await deleteJob(id);
    await deleteJob(meetingJobId);
  }
});

test("a failing handler releases the lock with backoff; max retries dead-letters the job", async () => {
  const id = await createJob(jobFixture());
  registerHandler("scheduled_message", async () => {
    throw new Error("kaboom");
  });

  try {
    await runScheduleTick({ limit: 1, now: new Date() });
    let row = await db.query.scheduledJob.findFirst({ where: eq(scheduledJob.id, id) });
    assert.equal(row?.processed, false);
    assert.equal(row?.lockId, null);
    assert.equal(row?.retryCount, 1);
    assert.equal(row?.lastError, "kaboom");

    // Not claimable while backoff (base 60s) is still pending.
    await runScheduleTick({ limit: 1 });
    row = await db.query.scheduledJob.findFirst({ where: eq(scheduledJob.id, id) });
    assert.equal(row?.retryCount, 1);

    // After the backoff window elapses the job is retried until it dead-letters.
    for (let attempt = 2; attempt <= 5; attempt++) {
      await db
        .update(scheduledJob)
        .set({ lastRetryAt: new Date(Date.now() - 30 * 60_000) })
        .where(eq(scheduledJob.id, id));
      await runScheduleTick({ limit: 1 });
      row = await db.query.scheduledJob.findFirst({ where: eq(scheduledJob.id, id) });
      assert.equal(row?.retryCount, attempt);
    }

    assert.equal(row?.processed, true, "exhausted job dead-letters as processed");
  } finally {
    await deleteJob(id);
  }
});