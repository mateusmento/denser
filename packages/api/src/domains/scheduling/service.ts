import type {
  AnyScheduledJobDto,
  ScheduledJobHandler,
  ScheduledJobHandlerMap,
  ScheduledJobId,
  ScheduledJobType,
} from "@denser/contracts";
import { getPort, registerPort } from "../../ports/container.js";
import * as repo from "./repository.js";

export const CLAIM_INTERVAL_MS = 10_000;
export const CLAIM_BATCH = 32;
export const MAX_RETRIES = repo.MAX_RETRIES;
export const STALE_LOCK_MS = repo.STALE_LOCK_MS;

// The scheduling module owns claim SQL; register the real implementation behind the
// `ClaimDueJobs` seam that the scaffold stubbed in `ports/index.ts`.
registerPort("claimDueJobs", repo.claimDueJobs);

const handlers: Partial<ScheduledJobHandlerMap> = {};

const defaultNoopHandlers: ScheduledJobHandlerMap = {
  scheduled_message: async (job, _ctx) => {
    console.log(`[scheduling] noop handler for scheduled_message ${job.id}`);
  },
  meeting_start: async (job, _ctx) => {
    console.log(`[scheduling] noop handler for meeting_start ${job.id}`);
  },
  meeting_reminder: async (job, _ctx) => {
    console.log(`[scheduling] noop handler for meeting_reminder ${job.id}`);
  },
};

export function registerHandler<K extends ScheduledJobType>(
  type: K,
  handler: ScheduledJobHandler<K>,
): void {
  handlers[type] = handler as ScheduledJobHandlerMap[K];
}

function getHandler<K extends ScheduledJobType>(type: K): ScheduledJobHandler<K> {
  return (handlers[type] ?? defaultNoopHandlers[type]) as ScheduledJobHandler<K>;
}

/** Persist a job built from a contracts factory. Returns the assigned job id. */
export async function createJob(job: AnyScheduledJobDto): Promise<ScheduledJobId> {
  return repo.insertScheduledJob(job);
}

/**
 * One scheduler tick: atomically claim a batch of due jobs and process each through its
 * typed handler. Success marks the occurrence processed; failure releases the lock with
 * exponential backoff and dead-letters the job once MAX_RETRIES is reached.
 *
 * TODO(bounded concurrency): v2 processes a bounded number of jobs in parallel (8–32).
 * Sequential dispatch is correct and sufficient for v1.
 */
export async function runScheduleTick(input: { now?: Date; limit?: number } = {}): Promise<number> {
  const now = input.now ?? new Date();
  const staleLockBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const { lockId, jobs } = await getPort("claimDueJobs")({
    now,
    limit: input.limit ?? CLAIM_BATCH,
    staleLockBefore,
  });

  let processed = 0;
  for (const occurrence of jobs) {
    await dispatchOne(occurrence, lockId);
    processed += 1;
  }
  return processed;
}

async function dispatchOne(
  occurrence: AnyScheduledJobDto & { occurrenceKey: string },
  lockId: string,
): Promise<void> {
  const handler = getHandler(occurrence.type);
  try {
    await handler(occurrence, { lockId });
    await repo.markProcessed(occurrence.id, lockId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await repo.markFailure(occurrence.id, lockId, message);
  }
}

type DispatcherOptions = { intervalMs?: number; limit?: number };

let dispatcherHandle: ReturnType<typeof setInterval> | null = null;

/** Poll-cron (~10s) dispatcher. Calling it again is a no-op while already running. */
export function startSchedulingDispatcher(options: DispatcherOptions = {}): void {
  if (dispatcherHandle) return;
  const intervalMs = options.intervalMs ?? CLAIM_INTERVAL_MS;

  const run = async () => {
    try {
      await runScheduleTick(
        options.limit !== undefined ? { limit: options.limit } : {},
      );
    } catch (error) {
      console.error("[scheduling] tick failed:", error);
    }
  };

  void run();
  dispatcherHandle = setInterval(() => {
    void run();
  }, intervalMs);
  dispatcherHandle.unref?.();
}

export function stopSchedulingDispatcher(): void {
  if (dispatcherHandle) {
    clearInterval(dispatcherHandle);
    dispatcherHandle = null;
  }
}
