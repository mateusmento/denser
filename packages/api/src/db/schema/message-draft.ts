import {
  type ArtifactId,
  type AttachmentId,
  type MessageDraftId,
  type MessageId,
  type SpaceId,
  type UserId,
} from "@denser/contracts";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { user } from "./auth.js";
import { attachment } from "./attachment.js";
import { space } from "./space.js";

export const messageDraft = pgTable(
  "message_draft",
  {
    id: uuid("id").primaryKey().$type<MessageDraftId>().defaultRandom(),
    rootSpaceId: uuid("root_space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .$type<ArtifactId>()
      .notNull()
      .references(() => artifact.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").$type<MessageId>(),
    body: jsonb("body").$type<unknown>(),
    quotesId: uuid("quotes_id").$type<MessageId>(),
    version: integer("version").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("message_draft_main_unique")
      .on(table.conversationId, table.authorId)
      .where(sql`${table.threadId} IS NULL`),
    uniqueIndex("message_draft_thread_unique")
      .on(table.conversationId, table.authorId, table.threadId)
      .where(sql`${table.threadId} IS NOT NULL`),
  ],
);

export const messageDraftAttachment = pgTable(
  "message_draft_attachment",
  {
    draftId: uuid("draft_id")
      .$type<MessageDraftId>()
      .notNull()
      .references(() => messageDraft.id, { onDelete: "cascade" }),
    attachmentId: uuid("attachment_id")
      .$type<AttachmentId>()
      .notNull()
      .references(() => attachment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.draftId, table.attachmentId] }),
    index("message_draft_attachment_attachment_id_idx").on(table.attachmentId),
  ],
);
