import {
  DEFAULT_SPACE_ICON,
  type AddSpaceMemberInput,
  type CreateSpaceInput,
  type PatchSpaceInput,
  type SpaceIcon,
  type SpaceId,
  type UserId,
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
  deleteSpaceById,
  findSpaceById,
  insertNestedSpace,
  insertOwnerMembership,
  insertRootSpace,
  listChildSpaces,
  listRootSpacesByIds,
  updateSpace,
  type SpaceRow,
} from "./repository.js";

async function enableMembership(spaceRow: SpaceRow): Promise<void> {
  if (spaceRow.parentSpaceId === null) {
    const existing = await findSpaceMember(spaceRow.id, spaceRow.createdBy);
    if (!existing) {
      await insertOwnerMembership({ spaceId: spaceRow.id, userId: spaceRow.createdBy });
    }
    return;
  }

  const rootSpaceId = spaceRow.rootSpaceId ?? spaceRow.id;
  await copyRootMembersToSpace(rootSpaceId, spaceRow.id);
  const creator = await findSpaceMember(spaceRow.id, spaceRow.createdBy);
  if (!creator) {
    await insertOwnerMembership({ spaceId: spaceRow.id, userId: spaceRow.createdBy });
  }
}

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

    if (visibility === "private") {
      await insertOwnerMembership({ spaceId: created.id, userId });
    }

    return { ok: true as const, space: toSpaceSummary(created) };
  }

  const visibility = input.visibility ?? "public";
  const created = await insertRootSpace({
    title: input.title,
    createdBy: userId,
    visibility,
  });
  if (visibility === "private") {
    await insertOwnerMembership({ spaceId: created.id, userId });
  }

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

  if (spaceRow.parentSpaceId === null && spaceRow.visibility === "public") {
    return { ok: false as const, reason: "membership_disabled" as const };
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

  const hasTitle = input.title !== undefined;
  const hasIcon = input.icon !== undefined;
  const hasVisibility = input.visibility !== undefined;

  if (!hasTitle && !hasIcon && !hasVisibility) {
    return { ok: true as const, space: toSpaceSummary(spaceRow) };
  }

  if (input.visibility !== undefined) {
    if (spaceRow.visibility === "private" && input.visibility === "public") {
      return { ok: false as const, reason: "invalid_visibility" as const };
    }

    const previousVisibility = spaceRow.visibility;
    if (previousVisibility === "public" && input.visibility === "private") {
      await enableMembership(spaceRow);
    }
  }

  const updated = await updateSpace(spaceId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.icon !== undefined ? { icon: input.icon ?? DEFAULT_SPACE_ICON } : {}),
    ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
  });

  if (!updated) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, space: toSpaceSummary(updated) };
}

export async function listHomeRootSpaces(userId: UserId) {
  const rootSpaceIds = await getAccessibleRootSpaceIds(userId);
  const rows = await listRootSpacesByIds(rootSpaceIds);
  return rows.map(toSpaceSummary);
}

export async function deleteSpace(
  userId: UserId,
  spaceId: SpaceId,
): Promise<{ ok: true } | { ok: false; reason: "forbidden" }> {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const childRows = await listChildSpaces(spaceId);
  for (const child of childRows) {
    if (!(await canManageSpace(userId, child.id))) {
      return { ok: false as const, reason: "forbidden" as const };
    }
  }

  for (const child of childRows) {
    const result: { ok: true } | { ok: false; reason: "forbidden" } = await deleteSpace(
      userId,
      child.id,
    );
    if (!result.ok) {
      return result;
    }
  }

  await deleteSpaceById(spaceId);
  return { ok: true as const };
}

export function resolveTenantRootSpaceId(row: SpaceRow): SpaceId {
  return row.rootSpaceId ?? row.id;
}
