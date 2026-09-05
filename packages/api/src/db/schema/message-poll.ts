import type { MessageId, PollId, PollOptionId, UserId } from "@denser/contracts";
import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { message } from "./message.js";

export const messagePoll = pgTable(
  "message_poll",
  {
    id: uuid("id").primaryKey().$type<PollId>().defaultRandom(),
    messageId: uuid("message_id").$type<MessageId>().notNull().references(() => message.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
  },
  (table) => [uniqueIndex("message_poll_message_id_unique").on(table.messageId)],
);

export const messagePollOption = pgTable(
  "message_poll_option",
  {
    id: uuid("id").primaryKey().$type<PollOptionId>().defaultRandom(),
    pollId: uuid("poll_id").$type<PollId>().notNull().references(() => messagePoll.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("message_poll_option_poll_idx").on(table.pollId)],
);

export const messagePollVote = pgTable(
  "message_poll_vote",
  {
    pollId: uuid("poll_id").$type<PollId>().notNull().references(() => messagePoll.id, { onDelete: "cascade" }),
    userId: uuid("user_id").$type<UserId>().notNull().references(() => user.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").$type<PollOptionId>().notNull().references(() => messagePollOption.id, { onDelete: "cascade" }),
    votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.pollId, table.userId] })],
);
