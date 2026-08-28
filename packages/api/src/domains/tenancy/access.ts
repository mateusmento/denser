import type { ArtifactId, SpaceId, SpaceRole, UserId } from "@denser/contracts";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import * as conversationRepository from "../conversations/repository.js";

export async function getDirectMembershipRole(
  userId: UserId,
  spaceId: SpaceId,
): Promise<SpaceRole | null> {
  const membership = await db.query.spaceMembership.findFirst({
    where: and(eq(spaceMembership.userId, userId), eq(spaceMembership.spaceId, spaceId)),
    columns: { role: true },
  });
  return membership?.role ?? null;
}

export async function isMemberOfSpace(userId: UserId, spaceId: SpaceId): Promise<boolean> {
  return (await getDirectMembershipRole(userId, spaceId)) !== null;
}

export async function canAccessSpace(userId: UserId, spaceId: SpaceId): Promise<boolean> {
  const row = await db.query.space.findFirst({
    where: eq(space.id, spaceId),
    columns: { id: true, parentSpaceId: true, visibility: true },
  });
  if (!row) return false;

  if (row.parentSpaceId === null) {
    return isMemberOfSpace(userId, spaceId);
  }

  if (!(await canAccessSpace(userId, row.parentSpaceId))) {
    return false;
  }

  if (row.visibility === "public") {
    return true;
  }

  return isMemberOfSpace(userId, spaceId);
}

export async function canManageSpace(userId: UserId, spaceId: SpaceId): Promise<boolean> {
  const row = await db.query.space.findFirst({
    where: eq(space.id, spaceId),
    columns: { id: true, rootSpaceId: true },
  });
  if (!row) return false;

  const rootSpaceId = row.rootSpaceId ?? row.id;
  const rootRole = await getDirectMembershipRole(userId, rootSpaceId);
  if (rootRole === "owner" || rootRole === "admin") {
    return true;
  }

  const directRole = await getDirectMembershipRole(userId, spaceId);
  return directRole === "admin";
}

export async function canAccessArtifact(
  userId: UserId,
  row: Pick<typeof artifact.$inferSelect, "id" | "kind" | "spaceId" | "rootSpaceId" | "createdBy">,
): Promise<boolean> {
  if (row.kind === "conversation") {
    const conversationRow = await conversationRepository.findConversationByArtifactId(row.id);
    if (conversationRow?.conversationKind === "direct") {
      return conversationRepository.isConversationMember(userId, row.id);
    }
  }

  if (row.spaceId === null) {
    return row.createdBy === userId;
  }
  return canAccessSpace(userId, row.spaceId);
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

export async function requireSpaceManagement(
  userId: UserId,
  spaceId: SpaceId,
): Promise<typeof space.$inferSelect | null> {
  const row = await db.query.space.findFirst({
    where: eq(space.id, spaceId),
  });
  if (!row) return null;
  if (!(await canManageSpace(userId, spaceId))) return null;
  return row;
}
