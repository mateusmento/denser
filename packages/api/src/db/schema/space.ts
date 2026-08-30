import { DEFAULT_SPACE_ICON, type SpaceId, type UserId } from "@denser/contracts";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const spaceRoleEnum = pgEnum("space_role", ["owner", "admin", "member"]);

export const spaceVisibilityEnum = pgEnum("space_visibility", ["public", "private"]);

export const sprintRoleEnum = pgEnum("sprint_role", ["upcoming", "active", "past"]);

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
    showBacklog: boolean("show_backlog").notNull().default(false),
    showBoard: boolean("show_board").notNull().default(false),
    sprintingEnabled: boolean("sprinting_enabled").notNull().default(false),
    sprintRole: sprintRoleEnum("sprint_role"),
    sprintDurationWeeks: integer("sprint_duration_weeks").notNull().default(2),
    nextSprintNumber: integer("next_sprint_number").notNull().default(1),
    sprintGoal: text("sprint_goal"),
    sprintStartedAt: timestamp("sprint_started_at", { withTimezone: true }),
    sprintCompletedAt: timestamp("sprint_completed_at", { withTimezone: true }),
    sprintPlannedEndAt: timestamp("sprint_planned_end_at", { withTimezone: true }),
    activeSprintId: uuid("active_sprint_id").$type<SpaceId>(),
    upcomingSprintId: uuid("upcoming_sprint_id").$type<SpaceId>(),
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
      "space_sprint_duration",
      sql`${table.sprintDurationWeeks} IN (1, 2, 4)`,
    ),
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
