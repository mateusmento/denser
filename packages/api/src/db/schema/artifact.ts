import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { space } from "./space.js";

export const artifactKindEnum = pgEnum("artifact_kind", ["document", "conversation"]);

export const artifact = pgTable(
  "artifact",
  {
    id: uuid("id").primaryKey().$type<ArtifactId>().defaultRandom(),
    kind: artifactKindEnum("kind").notNull(),
    title: text("title").notNull(),
    spaceId: uuid("space_id").$type<SpaceId>().references(() => space.id, { onDelete: "cascade" }),
    rootSpaceId: uuid("root_space_id").$type<SpaceId>(),
    createdBy: uuid("created_by")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("artifact_root_space_updated_idx").on(table.rootSpaceId, table.updatedAt),
    index("artifact_space_id_idx").on(table.spaceId),
    index("artifact_created_by_idx").on(table.createdBy),
    check(
      "artifact_location_invariant",
      sql`(
        (${table.spaceId} IS NULL AND ${table.rootSpaceId} IS NULL) OR
        (${table.spaceId} IS NOT NULL AND ${table.rootSpaceId} IS NOT NULL)
      )`,
    ),
  ],
);
