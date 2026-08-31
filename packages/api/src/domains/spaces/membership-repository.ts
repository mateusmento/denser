import type { SpaceId, SpaceRole, UserId } from "@denser/contracts";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { user } from "../../db/schema/auth.js";
import { spaceMembership } from "../../db/schema/space.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export type SpaceMemberRow = {
  userId: UserId;
  name: string;
  username: string | null;
  role: SpaceRole;
  createdAt: string;
};

export async function listSpaceMembers(spaceId: SpaceId): Promise<SpaceMemberRow[]> {
  const rows = await db
    .select({
      userId: spaceMembership.userId,
      role: spaceMembership.role,
      createdAt: spaceMembership.createdAt,
      name: user.name,
      username: user.username,
    })
    .from(spaceMembership)
    .innerJoin(user, eq(user.id, spaceMembership.userId))
    .where(eq(spaceMembership.spaceId, spaceId))
    .orderBy(user.name);

  return rows.map((row) => ({
    userId: row.userId,
    name: row.name,
    username: row.username,
    role: row.role,
    createdAt: toIso(row.createdAt),
  }));
}

export async function findUserByUsername(username: string): Promise<{ id: UserId } | undefined> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.username}) = lower(${username})`)
    .limit(1);

  return rows[0];
}

export async function insertSpaceMember(input: {
  spaceId: SpaceId;
  userId: UserId;
  role: SpaceRole;
}): Promise<void> {
  await db.insert(spaceMembership).values({
    spaceId: input.spaceId,
    userId: input.userId,
    role: input.role,
  });
}

export async function removeSpaceMember(spaceId: SpaceId, userId: UserId): Promise<boolean> {
  const deleted = await db
    .delete(spaceMembership)
    .where(and(eq(spaceMembership.spaceId, spaceId), eq(spaceMembership.userId, userId)))
    .returning({ userId: spaceMembership.userId });

  return deleted.length > 0;
}

export async function countOwners(spaceId: SpaceId): Promise<number> {
  const rows = await db
    .select({ userId: spaceMembership.userId })
    .from(spaceMembership)
    .where(and(eq(spaceMembership.spaceId, spaceId), eq(spaceMembership.role, "owner")));

  return rows.length;
}

/** When a nested space becomes private, seed explicit members from the root roster. */
export async function copyRootMembersToSpace(
  rootSpaceId: SpaceId,
  spaceId: SpaceId,
): Promise<void> {
  const rootMembers = await db
    .select({
      userId: spaceMembership.userId,
    })
    .from(spaceMembership)
    .where(eq(spaceMembership.spaceId, rootSpaceId));

  if (rootMembers.length === 0) return;

  await db
    .insert(spaceMembership)
    .values(
      rootMembers.map((member) => ({
        spaceId,
        userId: member.userId,
        role: "member" as const,
      })),
    )
    .onConflictDoNothing();
}

export async function findSpaceMember(
  spaceId: SpaceId,
  userId: UserId,
): Promise<SpaceMemberRow | undefined> {
  const rows = await listSpaceMembers(spaceId);
  return rows.find((member) => member.userId === userId);
}
