import type { ArtifactId, UserId } from "@denser/contracts";
import { primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";
import { user } from "./auth.js";
import { pgTable } from "drizzle-orm/pg-core";

export const conversationPeer = pgTable(
  "conversation_peer",
  {
    conversationArtifactId: uuid("conversation_artifact_id")
      .$type<ArtifactId>()
      .notNull()
      .references(() => artifact.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.conversationArtifactId, table.userId] })],
);
