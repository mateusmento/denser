import type { MessageId, UserId } from "@denser/contracts";
import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { message } from "./message.js";

export const messageReaction = pgTable(
  "message_reaction",
  {
    messageId: uuid("message_id").$type<MessageId>().notNull().references(() => message.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    userId: uuid("user_id").$type<UserId>().notNull().references(() => user.id, { onDelete: "cascade" }),
    reactedAt: timestamp("reacted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.emoji, table.userId] }),
    index("message_reaction_message_idx").on(table.messageId),
  ],
);
