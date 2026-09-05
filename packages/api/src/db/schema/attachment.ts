import {
  type ArtifactId,
  type AttachmentId,
  type MessageId,
  type SpaceId,
  type UserId,
} from "@denser/contracts";
import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { user } from "./auth.js";
import { message } from "./message.js";
import { space } from "./space.js";

export const attachment = pgTable(
  "attachment",
  {
    id: uuid("id").primaryKey().$type<AttachmentId>().defaultRandom(),
    rootSpaceId: uuid("root_space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .$type<ArtifactId>()
      .references(() => artifact.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    originalFilename: text("original_filename").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("attachment_root_space_idx").on(table.rootSpaceId)],
);

export const messageAttachment = pgTable(
  "message_attachment",
  {
    messageId: uuid("message_id")
      .$type<MessageId>()
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    attachmentId: uuid("attachment_id")
      .$type<AttachmentId>()
      .notNull()
      .references(() => attachment.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.attachmentId] }),
    index("message_attachment_attachment_id_idx").on(table.attachmentId),
  ],
);
