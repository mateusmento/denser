import {
  type ArtifactId,
  type ClientId,
  type MessageId,
  type SpaceId,
  type UserId,
} from "@denser/contracts";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { user } from "./auth.js";

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().$type<MessageId>().defaultRandom(),
    rootSpaceId: uuid("root_space_id").$type<SpaceId>(),
    conversationId: uuid("conversation_id")
      .$type<ArtifactId>()
      .notNull()
      .references(() => artifact.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").$type<MessageId>(),
    quotesId: uuid("quotes_id").$type<MessageId>(),
    authorId: uuid("author_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    body: jsonb("body").$type<unknown>(),
    clientId: uuid("client_id").$type<ClientId | null>(),
    occurrenceKey: text("occurrence_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("message_conversation_created_idx").on(table.conversationId, table.createdAt),
    index("message_thread_id_idx").on(table.threadId),
    index("message_client_id_idx").on(table.clientId),
    uniqueIndex("message_occurrence_key_unique").on(table.occurrenceKey),
    check("message_thread_self_reference", sql`${table.id} <> ${table.threadId}`),
  ],
);

export const readState = pgTable(
  "read_state",
  {
    conversationId: uuid("conversation_id")
      .$type<ArtifactId>()
      .notNull()
      .references(() => artifact.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.userId] })],
);
