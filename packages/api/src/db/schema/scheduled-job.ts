import { type AttachmentId, type ScheduledJobId, type SpaceId } from "@denser/contracts";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { attachment } from "./attachment.js";
import { space } from "./space.js";

export const scheduledJobTypeEnum = pgEnum("scheduled_job_type", [
  "scheduled_message",
  "meeting_start",
  "meeting_reminder",
]);

export const scheduledJob = pgTable(
  "scheduled_job",
  {
    id: uuid("id").primaryKey().$type<ScheduledJobId>().defaultRandom(),
    rootSpaceId: uuid("root_space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    type: scheduledJobTypeEnum("type").notNull(),
    payload: jsonb("payload").notNull().$type<unknown>(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    timezone: text("timezone"),
    recurrence: jsonb("recurrence").$type<unknown>(),
    processed: boolean("processed").notNull().default(false),
    lastOccurrenceAt: timestamp("last_occurrence_at", { withTimezone: true }),
    lockId: uuid("lock_id"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    lastRetryAt: timestamp("last_retry_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("scheduled_job_next_run_idx").on(table.nextRunAt),
    index("scheduled_job_root_space_type_idx").on(table.rootSpaceId, table.type),
  ],
);

export const scheduledJobAttachment = pgTable(
  "scheduled_job_attachment",
  {
    jobId: uuid("job_id")
      .$type<ScheduledJobId>()
      .notNull()
      .references(() => scheduledJob.id, { onDelete: "cascade" }),
    attachmentId: uuid("attachment_id")
      .$type<AttachmentId>()
      .notNull()
      .references(() => attachment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.jobId, table.attachmentId] }),
    index("scheduled_job_attachment_attachment_id_idx").on(table.attachmentId),
  ],
);
