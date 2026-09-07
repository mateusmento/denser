import { SEED_SPACE_ACME } from "@denser/contracts";
import { eq } from "drizzle-orm";
import { after, test } from "node:test";
import postgres from "postgres";
import { db } from "../../db/client.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";

const SCHEDULING_TEST_LOCK_KEY = 849_201;

let registeredSchedulingTestTeardown = false;

function registerSchedulingTestTeardown(): void {
  if (registeredSchedulingTestTeardown) {
    return;
  }
  registeredSchedulingTestTeardown = true;
  after(async () => {
    await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
  });
}

/** Remove scheduling rows created by unit tests that share SEED_SPACE_ACME. */
export async function cleanupSchedulingTestJobs(): Promise<void> {
  await db.delete(scheduledJob).where(eq(scheduledJob.rootSpaceId, SEED_SPACE_ACME));
}

async function withSchedulingTestIsolation<T>(fn: () => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const lockSql = postgres(url, { max: 1 });
  await lockSql`SELECT pg_advisory_lock(${SCHEDULING_TEST_LOCK_KEY})`;
  try {
    await cleanupSchedulingTestJobs();
    return await fn();
  } finally {
    await cleanupSchedulingTestJobs();
    await lockSql`SELECT pg_advisory_unlock(${SCHEDULING_TEST_LOCK_KEY})`;
    await lockSql.end({ timeout: 5 });
  }
}

export function schedulingTest(name: string, fn: () => Promise<void>): void {
  registerSchedulingTestTeardown();
  test(name, async () => {
    await withSchedulingTestIsolation(fn);
  });
}
