import type { ArtifactId, SpaceId } from "@denser/contracts";
import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { artifact } from "./artifact.js";

export const conversationKindEnum = pgEnum("conversation_kind", ["regular", "direct"]);

export const conversation = pgTable(
  "conversation",
  {
    artifactId: uuid("artifact_id")
      .$type<ArtifactId>()
      .primaryKey()
      .references(() => artifact.id, { onDelete: "cascade" }),
    conversationKind: conversationKindEnum("conversation_kind").notNull().default("regular"),
    rootSpaceId: uuid("root_space_id").$type<SpaceId>(),
    memberSetKey: text("member_set_key"),
    intro: text("intro"),
  },
  (table) => [
    uniqueIndex("conversation_direct_dedupe_idx")
      .on(table.rootSpaceId, table.memberSetKey)
      .where(sql`${table.conversationKind} = 'direct' AND ${table.memberSetKey} IS NOT NULL`),
  ],
);
