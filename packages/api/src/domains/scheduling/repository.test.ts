import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  createScheduledMessageJob,
  SEED_ARTIFACT_CHAN_GENERAL,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
  type ScheduledJobId,
} from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";
import { occurrenceKey, claimDueJobs, markFailure, MAX_RETRIES } from "./repository.js";

function dueJob() {
  const dueAt = new Date("2020-01-01T00:00:00.000Z");
  return createScheduledMessageJob(
    {
      rootSpaceId: SEED_SPACE_ACME,
      dueAt: dueAt.toISOString(),
      nextRunAt: dueAt.toISOString(),
    },
    {
      conversationId: SEED_ARTIFACT_CHAN_GENERAL,
      senderId: SEED_USER_ALICE,
      body: { type: "doc", content: [] },
    },
  );
}

async function insertJob(id?: ScheduledJobId): Promise<ScheduledJobId> {
  const values: typeof scheduledJob.$inferInsert = {
    rootSpaceId: SEED_SPACE_ACME,
    type: "scheduled_message",
    payload: dueJob().payload,
    dueAt: new Date("2020-01-01T00:00:00.000Z"),
    nextRunAt: new Date("2020-01-01T00:00:00.000Z"),
    processed: false,
  };
  const [row] = await db
    .insert(scheduledJob)
    .values(id ? { ...values, id } : values)
    .returning({ id: scheduledJob.id });
  return row!.id;
}

async function cleanup(id: ScheduledJobId): Promise<void> {
  await db.delete(scheduledJob).where(eq(scheduledJob.id, id));
}

test("occurrence key = job id + occurrence instant", () => {
  const at = new Date("2025-01-01T12:00:00.000Z");
  const id = randomUUID() as ScheduledJobId;
  assert.equal(occurrenceKey(id, at), `${id}:${at.toISOString()}`);
  assert.equal(occurrenceKey(id, at), occurrenceKey(id, at));
  assert.notEqual(occurrenceKey(id, at), occurrenceKey(id, new Date(at.getTime() + 1)));
});

test("two concurrent claimants do not double-take the same due job", async () => {
  const id = await insertJob();
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - 3_600_000);
  try {
    const [a, b] = await Promise.all([
      claimDueJobs({ now, limit: 10, staleLockBefore }),
      claimDueJobs({ now, limit: 10, staleLockBefore }),
    ]);
    const claimedById = (job: { id: ScheduledJobId }) => job.id === id;
    const takers = [a, b].filter((claim) => claim.jobs.some(claimedById));

    assert.equal(takers.length, 1, "exactly one claimant may take the job");
    const winner = takers[0]!;
    assert.equal(winner.jobs[0]!.id, id);
    assert.equal(winner.jobs[0]!.type, "scheduled_message");
    assert.equal(winner.jobs[0]!.payload.senderId, SEED_USER_ALICE);
    assert.equal(
      winner.jobs[0]!.occurrenceKey,
      occurrenceKey(id, new Date("2020-01-01T00:00:00.000Z")),
    );
    assert.ok(winner.lockId.length > 0);
  } finally {
    await cleanup(id);
  }
});

test("a stale lock is reclaimed after the TTL", async () => {
  const id = await insertJob();
  await db
    .update(scheduledJob)
    .set({ lockId: randomUUID(), lockedAt: new Date(Date.now() - 6 * 60_000) })
    .where(eq(scheduledJob.id, id));
  const now = new Date();
  try {
    const { jobs } = await claimDueJobs({
      now,
      limit: 10,
      staleLockBefore: new Date(now.getTime() - 5 * 60_000),
    });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]!.id, id);
  } finally {
    await cleanup(id);
  }
});

test("a non-stale lock is not reclaimable", async () => {
  const id = await insertJob();
  await db
    .update(scheduledJob)
    .set({ lockId: randomUUID(), lockedAt: new Date() })
    .where(eq(scheduledJob.id, id));
  const now = new Date();
  try {
    const { jobs } = await claimDueJobs({
      now,
      limit: 10,
      staleLockBefore: new Date(now.getTime() - 5 * 60_000),
    });
    assert.equal(jobs.length, 0);
  } finally {
    await cleanup(id);
  }
});

test("failed jobs wait for exponential backoff before being reclaimed", async () => {
  const id = await insertJob();
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - 3_600_000);
  try {
    const first = await claimDueJobs({ now, limit: 10, staleLockBefore });
    assert.equal(first.jobs.length, 1);

    const { retryCount, exceededMaxRetries } = await markFailure(id, first.lockId, "boom");
    assert.equal(retryCount, 1);
    assert.equal(exceededMaxRetries, false);

    // Backoff (1 min) not elapsed yet: not claimable.
    const notDue = await claimDueJobs({
      now: new Date(now.getTime() + 30_000),
      limit: 10,
      staleLockBefore,
    });
    assert.equal(notDue.jobs.length, 0);

    // Once the backoff window has elapsed it becomes claimable again.
    await db
      .update(scheduledJob)
      .set({ lastRetryAt: new Date(Date.now() - 2 * 60_000) })
      .where(eq(scheduledJob.id, id));
    const again = await claimDueJobs({
      now: new Date(Date.now() + 1000),
      limit: 10,
      staleLockBefore: new Date(Date.now() + 1000 - 3_600_000),
    });
    assert.equal(again.jobs.length, 1);
    assert.equal(again.jobs[0]!.id, id);
  } finally {
    await cleanup(id);
  }
});

test("jobs past max retries are never claimed again", async () => {
  const id = await insertJob();
  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const now = new Date();
      const { jobs, lockId } = await claimDueJobs({
        now,
        limit: 10,
        staleLockBefore: new Date(now.getTime() - 3_600_000),
      });
      assert.equal(jobs.length, 1, `claimable on attempt ${attempt}`);
      await markFailure(id, lockId, "boom");
      await db
        .update(scheduledJob)
        .set({ lastRetryAt: new Date(Date.now() - 30 * 60_000) })
        .where(eq(scheduledJob.id, id));
    }

    const { jobs } = await claimDueJobs({
      now: new Date(),
      limit: 10,
      staleLockBefore: new Date(Date.now() - 3_600_000),
    });
    assert.equal(jobs.length, 0, "exhausted job must not be claimable");
  } finally {
    await cleanup(id);
  }
});
