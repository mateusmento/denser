import {
  DEFAULT_SPACE_ICON,
  type SpaceIcon,
  type SpaceId,
  type SpaceVisibility,
  type SprintDurationWeeks,
  type SprintRole,
  type UserId,
} from "@denser/contracts";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { space, spaceMembership } from "../../db/schema/space.js";

export type SpaceRow = typeof space.$inferSelect;

export type SpacePlanningInsert = {
  showBacklog?: boolean;
  showBoard?: boolean;
  sprintingEnabled?: boolean;
  sprintRole?: SprintRole | null;
  sprintDurationWeeks?: SprintDurationWeeks;
};

export async function findSpaceById(spaceId: SpaceId): Promise<SpaceRow | undefined> {
  return db.query.space.findFirst({ where: eq(space.id, spaceId) });
}

export async function listRootSpacesByIds(ids: readonly SpaceId[]): Promise<SpaceRow[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(space)
    .where(and(inArray(space.id, ids), isNull(space.parentSpaceId)))
    .orderBy(space.title);
}

export async function listChildSpaces(parentSpaceId: SpaceId): Promise<SpaceRow[]> {
  return db.select().from(space).where(eq(space.parentSpaceId, parentSpaceId)).orderBy(space.title);
}

function planningValues(input: SpacePlanningInsert | undefined): SpacePlanningInsert {
  return input ?? {};
}

export async function insertRootSpace(input: {
  title: string;
  createdBy: UserId;
  visibility?: SpaceVisibility;
  planning?: SpacePlanningInsert;
}): Promise<SpaceRow> {
  const planning = planningValues(input.planning);
  const [created] = await db
    .insert(space)
    .values({
      title: input.title,
      icon: DEFAULT_SPACE_ICON,
      visibility: input.visibility ?? "public",
      createdBy: input.createdBy,
      showBacklog: planning.showBacklog ?? false,
      showBoard: planning.showBoard ?? false,
      sprintingEnabled: planning.sprintingEnabled ?? false,
      sprintDurationWeeks: planning.sprintDurationWeeks ?? 2,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create root space");
  }

  return created;
}

export async function insertNestedSpace(input: {
  title: string;
  parentSpaceId: SpaceId;
  rootSpaceId: SpaceId;
  createdBy: UserId;
  visibility?: SpaceVisibility;
  planning?: SpacePlanningInsert;
}): Promise<SpaceRow> {
  const planning = planningValues(input.planning);
  const [created] = await db
    .insert(space)
    .values({
      title: input.title,
      icon: DEFAULT_SPACE_ICON,
      parentSpaceId: input.parentSpaceId,
      rootSpaceId: input.rootSpaceId,
      visibility: input.visibility ?? "public",
      createdBy: input.createdBy,
      showBacklog: planning.showBacklog ?? false,
      showBoard: planning.showBoard ?? false,
      sprintingEnabled: planning.sprintingEnabled ?? false,
      sprintRole: planning.sprintRole,
      sprintDurationWeeks: planning.sprintDurationWeeks ?? 2,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create nested space");
  }

  return created;
}

export async function updateSpace(
  spaceId: SpaceId,
  patch: {
    title?: string;
    icon?: SpaceIcon | null;
    visibility?: SpaceVisibility;
    sprintingEnabled?: boolean;
    sprintRole?: SprintRole | null;
    nextSprintNumber?: number;
    sprintGoal?: string | null;
    sprintStartedAt?: Date | null;
    sprintCompletedAt?: Date | null;
    sprintPlannedEndAt?: Date | null;
    activeSprintId?: SpaceId | null;
    upcomingSprintId?: SpaceId | null;
    parentSpaceId?: SpaceId | null;
    rootSpaceId?: SpaceId | null;
  },
): Promise<SpaceRow | undefined> {
  const values: Partial<typeof space.$inferInsert> = { updatedAt: new Date() };
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.icon !== undefined) values.icon = patch.icon;
  if (patch.visibility !== undefined) values.visibility = patch.visibility;
  if (patch.sprintingEnabled !== undefined) values.sprintingEnabled = patch.sprintingEnabled;
  if (patch.sprintRole !== undefined) values.sprintRole = patch.sprintRole;
  if (patch.nextSprintNumber !== undefined) values.nextSprintNumber = patch.nextSprintNumber;
  if (patch.sprintGoal !== undefined) values.sprintGoal = patch.sprintGoal;
  if (patch.sprintStartedAt !== undefined) values.sprintStartedAt = patch.sprintStartedAt;
  if (patch.sprintCompletedAt !== undefined) values.sprintCompletedAt = patch.sprintCompletedAt;
  if (patch.sprintPlannedEndAt !== undefined) values.sprintPlannedEndAt = patch.sprintPlannedEndAt;
  if (patch.activeSprintId !== undefined) values.activeSprintId = patch.activeSprintId;
  if (patch.upcomingSprintId !== undefined) values.upcomingSprintId = patch.upcomingSprintId;
  if (patch.parentSpaceId !== undefined) values.parentSpaceId = patch.parentSpaceId;
  if (patch.rootSpaceId !== undefined) values.rootSpaceId = patch.rootSpaceId;

  const [updated] = await db.update(space).set(values).where(eq(space.id, spaceId)).returning();
  return updated;
}

export async function insertOwnerMembership(input: {
  spaceId: SpaceId;
  userId: UserId;
}): Promise<void> {
  await db.insert(spaceMembership).values({
    spaceId: input.spaceId,
    userId: input.userId,
    role: "owner",
  });
}

export async function deleteSpaceById(spaceId: SpaceId): Promise<void> {
  await db.delete(space).where(eq(space.id, spaceId));
}
