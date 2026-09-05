import type {
  AnyScheduledJobDto,
  ClaimDueJobs,
  ScheduledJobId,
} from "@denser/contracts";
import {
  computeNextRunAt,
  parseScheduledJobRecurrence,
  parseScheduledJobRow,
  type ResolvedScheduleTiming,
} from "@denser/contracts";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";

export const MAX_RETRIES = 5;
export const BASE_BACKOFF_MS = 60_000;
export const STALE_LOCK_MS = 5 * 60_000;

type ClaimedRow = {
  id: string;
  root_space_id: string;
  type: string;
  payload: unknown;
  due_at: Date | string;
  next_run_at: Date | string;
  timezone: string | null;
  recurrence: unknown;
  processed: boolean;
  last_occurrence_at: Date | string | null;
};

/** A single fire of a job is uniquely identified by its id + occurrence instant. */
export function occurrenceKey(jobId: ScheduledJobId, occurrenceAt: Date): string {
  return `${jobId}:${occurrenceAt.toISOString()}`;
}

/**
 * Claim due jobs atomically with `FOR UPDATE SKIP LOCKED`.
 * One fire of the same row can only be claimed by a single claimant (stale locks are
 * reclaimable after the TTL), so two workers never double-take the same occurrence.
 */
export const claimDueJobs: ClaimDueJobs = async ({ now, limit, staleLockBefore }) => {
  const lockId = randomUUID();
  const nowIso = now.toISOString();
  const staleLockBeforeIso = staleLockBefore.toISOString();
  const result = (await db.execute(sql`
    WITH locked_rows AS (
      SELECT sj.id
      FROM ${scheduledJob} sj
      WHERE
        sj.processed = false
        AND (sj.lock_id IS NULL OR sj.locked_at < ${staleLockBeforeIso})
        AND sj.next_run_at <= ${nowIso}
        AND sj.retry_count < ${MAX_RETRIES}
        AND (
          sj.retry_count = 0
          OR sj.last_retry_at IS NULL
          OR sj.last_retry_at + ${sql`make_interval(secs => ${BASE_BACKOFF_MS / 1000} * power(2, GREATEST(0, sj.retry_count - 1)))`} <= now()
        )
      ORDER BY sj.next_run_at ASC, sj.id ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE ${scheduledJob} sj
    SET lock_id = ${lockId}, locked_at = now()
    FROM locked_rows
    WHERE sj.id = locked_rows.id
      AND (sj.lock_id IS NULL OR sj.locked_at < ${staleLockBeforeIso})
    RETURNING
      sj.id,
      sj.root_space_id,
      sj.type,
      sj.payload,
      sj.due_at,
      sj.next_run_at,
      sj.timezone,
      sj.recurrence,
      sj.processed,
      sj.last_occurrence_at
  `)) as unknown[];

  const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? [];
  const jobs = rows.map((row) => {
    const r = row as unknown as ClaimedRow;
    const dueAt = toDate(r.due_at);
    const nextRunAt = toDate(r.next_run_at);
    const dto = parseScheduledJobRow({
      id: r.id as ScheduledJobId,
      rootSpaceId: r.root_space_id as AnyScheduledJobDto["rootSpaceId"],
      type: r.type as AnyScheduledJobDto["type"],
      payload: r.payload,
      dueAt: dueAt.toISOString(),
      nextRunAt: nextRunAt.toISOString(),
      timezone: r.timezone,
      recurrence: parseScheduledJobRecurrence(r.recurrence !== undefined ? r.recurrence : null),
      processed: r.processed,
      lastOccurrenceAt: r.last_occurrence_at ? toDate(r.last_occurrence_at).toISOString() : null,
    });
    return { ...dto, occurrenceKey: occurrenceKey(dto.id, nextRunAt) };
  });

  return { lockId, jobs };
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function insertScheduledJob(job: AnyScheduledJobDto): Promise<ScheduledJobId> {
  const [row] = await db
    .insert(scheduledJob)
    .values({
      rootSpaceId: job.rootSpaceId,
      type: job.type,
      payload: job.payload,
      dueAt: new Date(job.dueAt),
      nextRunAt: new Date(job.nextRunAt),
      timezone: job.timezone ?? null,
      recurrence: job.recurrence ?? null,
      processed: job.processed,
      lastOccurrenceAt: job.lastOccurrenceAt ? new Date(job.lastOccurrenceAt) : null,
    })
    .returning({ id: scheduledJob.id });

  if (!row) {
    throw new Error("Failed to create scheduled job");
  }
  return row.id;
}

/** Mark a once job processed and release its lock. */
export async function markProcessed(jobId: ScheduledJobId, lockId: string): Promise<void> {
  await db
    .update(scheduledJob)
    .set({
      processed: true,
      lockId: null,
      lockedAt: null,
      retryCount: 0,
      lastError: null,
      lastRetryAt: null,
    })
    .where(and(eq(scheduledJob.id, jobId), eq(scheduledJob.lockId, lockId)));
}

/** Record a failure: release lock, bump retry count, and schedule the next backoff.
 * When the failure reaches MAX_RETRIES the job is dead-lettered as processed atomically. */
export async function markFailure(
  jobId: ScheduledJobId,
  lockId: string,
  error: string,
): Promise<{ retryCount: number; exceededMaxRetries: boolean }> {
  const [row] = await db
    .update(scheduledJob)
    .set({
      lockId: null,
      lockedAt: null,
      retryCount: sql`${scheduledJob.retryCount} + 1`,
      lastRetryAt: new Date(),
      lastError: error.slice(0, 1024),
      processed: sql`${scheduledJob.retryCount} + 1 >= ${MAX_RETRIES}`,
    })
    .where(and(eq(scheduledJob.id, jobId), eq(scheduledJob.lockId, lockId)))
    .returning({ retryCount: scheduledJob.retryCount });

  const retryCount = row?.retryCount ?? 0;
  return { retryCount, exceededMaxRetries: retryCount >= MAX_RETRIES };
}

export async function getScheduledJobById(jobId: ScheduledJobId): Promise<AnyScheduledJobDto | null> {
  const row = await db.query.scheduledJob.findFirst({ where: eq(scheduledJob.id, jobId) });
  if (!row) return null;
  return parseScheduledJobRow({
    id: row.id,
    rootSpaceId: row.rootSpaceId,
    type: row.type as AnyScheduledJobDto["type"],
    payload: row.payload,
    dueAt: row.dueAt.toISOString(),
    nextRunAt: row.nextRunAt.toISOString(),
    timezone: row.timezone,
    recurrence: parseScheduledJobRecurrence(row.recurrence !== undefined ? row.recurrence : null),
    processed: row.processed,
    lastOccurrenceAt: row.lastOccurrenceAt ? row.lastOccurrenceAt.toISOString() : null,
  });
}

export async function updateScheduledJobSchedule(
  jobId: ScheduledJobId,
  timing: ResolvedScheduleTiming,
): Promise<void> {
  await db
    .update(scheduledJob)
    .set({
      dueAt: new Date(timing.dueAt),
      nextRunAt: new Date(timing.nextRunAt),
      timezone: timing.timezone,
      recurrence: timing.recurrence,
    })
    .where(eq(scheduledJob.id, jobId));
}

/** After a successful fire: once jobs finish; recurring jobs advance `next_run_at`. */
export async function markOccurrenceSuccess(
  jobId: ScheduledJobId,
  lockId: string,
  occurrenceAt: Date,
): Promise<void> {
  const job = await getScheduledJobById(jobId);
  if (!job) {
    return;
  }

  const recurrence = job.recurrence ?? { frequency: "once" as const };
  const isOnce = recurrence.frequency === "once";

  if (isOnce) {
    await db
      .update(scheduledJob)
      .set({
        processed: true,
        lastOccurrenceAt: occurrenceAt,
        lockId: null,
        lockedAt: null,
        retryCount: 0,
        lastError: null,
        lastRetryAt: null,
      })
      .where(and(eq(scheduledJob.id, jobId), eq(scheduledJob.lockId, lockId)));
    return;
  }

  const next = computeNextRunAt({
    dueAt: job.dueAt,
    recurrence,
    timezone: job.timezone,
    after: occurrenceAt,
  });

  await db
    .update(scheduledJob)
    .set({
      processed: next === null,
      lastOccurrenceAt: occurrenceAt,
      nextRunAt: next ?? occurrenceAt,
      lockId: null,
      lockedAt: null,
      retryCount: 0,
      lastError: null,
      lastRetryAt: null,
    })
    .where(and(eq(scheduledJob.id, jobId), eq(scheduledJob.lockId, lockId)));
}
