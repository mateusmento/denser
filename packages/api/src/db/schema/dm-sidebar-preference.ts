import type { ArtifactId, UserId } from "@denser/contracts";
import { boolean, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { user } from "./auth.js";
import { pgTable } from "drizzle-orm/pg-core";

export const dmSidebarPreference = pgTable(
  "dm_sidebar_preference",
  {
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationArtifactId: uuid("conversation_artifact_id")
      .$type<ArtifactId>()
      .notNull()
      .references(() => artifact.id, { onDelete: "cascade" }),
    hidden: boolean("hidden").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.conversationArtifactId] })],
);
