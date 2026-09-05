import type {
  AnyScheduledJobDto,
  ScheduledJobDto,
  ScheduledJobId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { parseScheduledJobRow } from "@denser/contracts";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";

export type ScheduledMessageRow = ScheduledJobDto<"scheduled_message"> & {
  lastError: string | null;
};

function toScheduledMessageRow(row: typeof scheduledJob.$inferSelect): ScheduledMessageRow {
  const dto = parseScheduledJobRow({
    id: row.id,
    rootSpaceId: row.rootSpaceId,
    type: row.type as AnyScheduledJobDto["type"],
    payload: row.payload,
    dueAt: row.dueAt.toISOString(),
    nextRunAt: row.nextRunAt.toISOString(),
    timezone: row.timezone,
    recurrence: row.recurrence ?? null,
    processed: row.processed,
    lastOccurrenceAt: row.lastOccurrenceAt ? row.lastOccurrenceAt.toISOString() : null,
  });
  if (dto.type !== "scheduled_message") {
    throw new Error(`Expected scheduled_message job, got ${dto.type}`);
  }
  return { ...dto, lastError: row.lastError ?? null };
}

export async function listActiveScheduledMessagesForConversation(
  conversationId: string,
  rootSpaceId: SpaceId,
): Promise<ScheduledMessageRow[]> {
  const rows = await db
    .select()
    .from(scheduledJob)
    .where(
      and(
        eq(scheduledJob.rootSpaceId, rootSpaceId),
        eq(scheduledJob.type, "scheduled_message"),
        eq(scheduledJob.processed, false),
        sql`${scheduledJob.payload}->>'conversationId' = ${conversationId}`,
      ),
    )
    .orderBy(scheduledJob.dueAt, scheduledJob.id);

  return rows.map(toScheduledMessageRow);
}

export async function findScheduledMessageJob(
  jobId: ScheduledJobId,
  rootSpaceId: SpaceId,
): Promise<ScheduledMessageRow | null> {
  const row = await db.query.scheduledJob.findFirst({
    where: and(
      eq(scheduledJob.id, jobId),
      eq(scheduledJob.rootSpaceId, rootSpaceId),
      eq(scheduledJob.type, "scheduled_message"),
    ),
  });
  return row ? toScheduledMessageRow(row) : null;
}

export async function updateScheduledMessageJob(input: {
  jobId: ScheduledJobId;
  rootSpaceId: SpaceId;
  payload: ScheduledJobDto<"scheduled_message">["payload"];
  dueAt: string;
  nextRunAt: string;
}): Promise<ScheduledMessageRow | null> {
  const [row] = await db
    .update(scheduledJob)
    .set({
      payload: input.payload,
      dueAt: new Date(input.dueAt),
      nextRunAt: new Date(input.nextRunAt),
    })
    .where(
      and(
        eq(scheduledJob.id, input.jobId),
        eq(scheduledJob.rootSpaceId, input.rootSpaceId),
        eq(scheduledJob.type, "scheduled_message"),
        eq(scheduledJob.processed, false),
      ),
    )
    .returning();
  return row ? toScheduledMessageRow(row) : null;
}

export async function cancelScheduledMessageJob(
  jobId: ScheduledJobId,
  rootSpaceId: SpaceId,
  senderId: UserId,
): Promise<ScheduledMessageRow | null> {
  const existing = await findScheduledMessageJob(jobId, rootSpaceId);
  if (!existing || existing.payload.senderId !== senderId) {
    return null;
  }

  const [row] = await db
    .update(scheduledJob)
    .set({ processed: true, lastError: null })
    .where(
      and(
        eq(scheduledJob.id, jobId),
        eq(scheduledJob.rootSpaceId, rootSpaceId),
        eq(scheduledJob.processed, false),
      ),
    )
    .returning();
  return row ? toScheduledMessageRow(row) : null;
}
