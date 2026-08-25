import type { SpaceId, UserId } from "@denser/contracts";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { space, spaceMembership } from "../../db/schema/space.js";

export type SpaceRow = typeof space.$inferSelect;

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
  return db
    .select()
    .from(space)
    .where(eq(space.parentSpaceId, parentSpaceId))
    .orderBy(space.title);
}

export async function insertRootSpace(input: {
  title: string;
  createdBy: UserId;
}): Promise<SpaceRow> {
  const [created] = await db
    .insert(space)
    .values({
      title: input.title,
      createdBy: input.createdBy,
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
}): Promise<SpaceRow> {
  const [created] = await db
    .insert(space)
    .values({
      title: input.title,
      parentSpaceId: input.parentSpaceId,
      rootSpaceId: input.rootSpaceId,
      createdBy: input.createdBy,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create nested space");
  }

  return created;
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
