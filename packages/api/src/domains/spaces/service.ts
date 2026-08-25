import type {
  AddSpaceMemberInput,
  CreateSpaceInput,
  PatchSpaceInput,
  SpaceId,
  UserId,
} from "@denser/contracts";
import {
  canAccessSpace,
  canManageSpace,
  getAccessibleRootSpaceIds,
  requireSpaceAccess,
  requireSpaceManagement,
} from "../tenancy/access.js";
import * as artifactRepository from "../artifacts/repository.js";
import { toArtifactSummary } from "../artifacts/mapper.js";
import { toSpaceMember, toSpaceSummary } from "./mapper.js";
import {
  copyRootMembersToSpace,
  countOwners,
  findSpaceMember,
  findUserByUsername,
  insertSpaceMember,
  listSpaceMembers,
  removeSpaceMember,
} from "./membership-repository.js";
import {
  insertNestedSpace,
  insertOwnerMembership,
  insertRootSpace,
  listChildSpaces,
  listRootSpacesByIds,
  updateSpaceVisibility,
  type SpaceRow,
} from "./repository.js";

export async function createSpace(userId: UserId, input: CreateSpaceInput) {
  if (input.parentSpaceId) {
    const parent = await requireSpaceAccess(userId, input.parentSpaceId);
    if (!parent) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const visibility = input.visibility ?? "public";
    const created = await insertNestedSpace({
      title: input.title,
      parentSpaceId: parent.id,
      rootSpaceId: parent.rootSpaceId ?? parent.id,
      createdBy: userId,
      visibility,
    });

    return { ok: true as const, space: toSpaceSummary(created) };
  }

  if (input.visibility && input.visibility !== "private") {
    return { ok: false as const, reason: "invalid_visibility" as const };
  }

  const created = await insertRootSpace({ title: input.title, createdBy: userId });
  await insertOwnerMembership({ spaceId: created.id, userId });

  return { ok: true as const, space: toSpaceSummary(created) };
}

export async function getSpaceDetail(userId: UserId, spaceId: SpaceId) {
  const row = await requireSpaceAccess(userId, spaceId);
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const childRows = await listChildSpaces(spaceId);
  const accessibleChildren: SpaceRow[] = [];
  for (const child of childRows) {
    if (await canAccessSpace(userId, child.id)) {
      accessibleChildren.push(child);
    }
  }

  const artifacts = await artifactRepository.listArtifactsInSpace(spaceId);
  const members = await listSpaceMembers(spaceId);
  const canManage = await canManageSpace(userId, spaceId);

  return {
    ok: true as const,
    space: toSpaceSummary(row),
    childSpaces: accessibleChildren.map(toSpaceSummary),
    artifacts: artifacts.map(toArtifactSummary),
    members: members.map(toSpaceMember),
    canManage,
  };
}

export async function addSpaceMember(
  userId: UserId,
  spaceId: SpaceId,
  input: AddSpaceMemberInput,
) {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const targetUser = await findUserByUsername(input.username);
  if (!targetUser) {
    return { ok: false as const, reason: "user_not_found" as const };
  }

  const existing = await findSpaceMember(spaceId, targetUser.id);
  if (existing) {
    return { ok: false as const, reason: "already_member" as const };
  }

  if (spaceRow.parentSpaceId === null && input.role === "admin") {
    // root spaces support owner/admin/member; assignable admin is valid
  }

  await insertSpaceMember({
    spaceId,
    userId: targetUser.id,
    role: input.role,
  });

  const member = await findSpaceMember(spaceId, targetUser.id);
  if (!member) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, member: toSpaceMember(member) };
}

export async function deleteSpaceMember(
  actorId: UserId,
  spaceId: SpaceId,
  memberUserId: UserId,
) {
  const spaceRow = await requireSpaceManagement(actorId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const member = await findSpaceMember(spaceId, memberUserId);
  if (!member) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (spaceRow.parentSpaceId === null && member.role === "owner") {
    const owners = await countOwners(spaceId);
    if (owners <= 1) {
      return { ok: false as const, reason: "last_owner" as const };
    }
  }

  await removeSpaceMember(spaceId, memberUserId);
  return { ok: true as const };
}

export async function patchSpace(userId: UserId, spaceId: SpaceId, input: PatchSpaceInput) {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  if (input.visibility === undefined) {
    return { ok: true as const, space: toSpaceSummary(spaceRow) };
  }

  if (spaceRow.parentSpaceId === null) {
    return { ok: false as const, reason: "invalid_visibility" as const };
  }

  const previousVisibility = spaceRow.visibility;
  const updated = await updateSpaceVisibility(spaceId, input.visibility);
  if (!updated) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (previousVisibility === "public" && input.visibility === "private") {
    const rootSpaceId = spaceRow.rootSpaceId ?? spaceRow.id;
    await copyRootMembersToSpace(rootSpaceId, spaceId);
  }

  return { ok: true as const, space: toSpaceSummary(updated) };
}

export async function listHomeRootSpaces(userId: UserId) {
  const rootSpaceIds = await getAccessibleRootSpaceIds(userId);
  const rows = await listRootSpacesByIds(rootSpaceIds);
  return rows.map(toSpaceSummary);
}

export function resolveTenantRootSpaceId(row: SpaceRow): SpaceId {
  return row.rootSpaceId ?? row.id;
}
