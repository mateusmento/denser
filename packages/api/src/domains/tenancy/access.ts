import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { space, spaceMembership } from "../../db/schema/space.js";

export async function isMemberOfSpace(userId: UserId, spaceId: SpaceId): Promise<boolean> {
  const membership = await db.query.spaceMembership.findFirst({
    where: and(eq(spaceMembership.userId, userId), eq(spaceMembership.spaceId, spaceId)),
    columns: { spaceId: true },
  });
  return membership !== undefined;
}

export async function canAccessSpace(userId: UserId, spaceId: SpaceId): Promise<boolean> {
  const row = await db.query.space.findFirst({
    where: eq(space.id, spaceId),
    columns: { id: true, rootSpaceId: true },
  });
  if (!row) return false;

  const tenantSpaceId = row.rootSpaceId ?? row.id;
  return isMemberOfSpace(userId, tenantSpaceId);
}

export async function canAccessArtifact(
  userId: UserId,
  row: Pick<typeof artifact.$inferSelect, "spaceId" | "rootSpaceId" | "createdBy">,
): Promise<boolean> {
  if (row.spaceId === null) {
    return row.createdBy === userId;
  }
  if (row.rootSpaceId === null) {
    return false;
  }
  return isMemberOfSpace(userId, row.rootSpaceId);
}

export async function getAccessibleRootSpaceIds(userId: UserId): Promise<SpaceId[]> {
  const rows = await db
    .select({ spaceId: spaceMembership.spaceId })
    .from(spaceMembership)
    .innerJoin(space, eq(space.id, spaceMembership.spaceId))
    .where(and(eq(spaceMembership.userId, userId), isNull(space.parentSpaceId)));

  return rows.map((row) => row.spaceId);
}

export async function requireSpaceAccess(
  userId: UserId,
  spaceId: SpaceId,
): Promise<typeof space.$inferSelect | null> {
  const row = await db.query.space.findFirst({
    where: eq(space.id, spaceId),
  });
  if (!row) return null;
  if (!(await canAccessSpace(userId, spaceId))) return null;
  return row;
}

export async function requireArtifactAccess(
  userId: UserId,
  artifactId: ArtifactId,
): Promise<typeof artifact.$inferSelect | null> {
  const row = await db.query.artifact.findFirst({
    where: eq(artifact.id, artifactId),
  });
  if (!row) return null;
  if (!(await canAccessArtifact(userId, row))) return null;
  return row;
}
