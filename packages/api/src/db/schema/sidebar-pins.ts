import type { SpaceId, UserId } from "@denser/contracts";
import { sql } from "drizzle-orm";
import { check, integer, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { pgTable } from "drizzle-orm/pg-core";
import { space } from "./space.js";

export const spaceSidebarPin = pgTable(
  "space_sidebar_pin",
  {
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rootSpaceId: uuid("root_space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.rootSpaceId, table.spaceId] }),
  ],
);

export const sidebarSectionPreference = pgTable(
  "sidebar_section_preference",
  {
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rootSpaceId: uuid("root_space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    itemLimit: integer("item_limit").notNull().default(7),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.rootSpaceId, table.spaceId] }),
    check(
      "sidebar_section_preference_item_limit_check",
      sql`${table.itemLimit} IN (5, 7, 15, 30, 50)`,
    ),
  ],
);
