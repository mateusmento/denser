import { DEFAULT_SPACE_ICON, type SpaceId, type UserId } from "@denser/contracts";
import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const spaceRoleEnum = pgEnum("space_role", ["owner", "admin", "member"]);

export const spaceVisibilityEnum = pgEnum("space_visibility", ["public", "private"]);

export const space = pgTable(
  "space",
  {
    id: uuid("id").primaryKey().$type<SpaceId>().defaultRandom(),
    title: text("title").notNull(),
    parentSpaceId: uuid("parent_space_id").$type<SpaceId>(),
    rootSpaceId: uuid("root_space_id").$type<SpaceId>(),
    visibility: spaceVisibilityEnum("visibility").notNull().default("public"),
    icon: text("icon").default(DEFAULT_SPACE_ICON),
    createdBy: uuid("created_by")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("space_parent_space_id_idx").on(table.parentSpaceId),
    index("space_root_space_id_idx").on(table.rootSpaceId),
    index("space_created_by_idx").on(table.createdBy),
    check(
      "space_location_invariant",
      sql`(
        (${table.parentSpaceId} IS NULL AND ${table.rootSpaceId} IS NULL) OR
        (${table.parentSpaceId} IS NOT NULL AND ${table.rootSpaceId} IS NOT NULL)
      )`,
    ),
  ],
);

export const spaceMembership = pgTable(
  "space_membership",
  {
    spaceId: uuid("space_id")
      .$type<SpaceId>()
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: spaceRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.spaceId, table.userId] }),
    index("space_membership_user_id_idx").on(table.userId),
  ],
);
