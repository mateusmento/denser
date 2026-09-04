import {
  DEFAULT_SPACE_ICON,
  type AddSpaceMemberInput,
  type CreateSpaceInput,
  type PatchSpaceInput,
  type SpaceId,
  type SpacePreset,
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
import { provisionDefaultDocumentTypes, provisionProjectPlanning } from "../workflows/repository.js";
import { loadPlanningForSpace } from "../workflows/service.js";
import { toSpaceMember, toSpaceSummary } from "./mapper.js";
import { planningOwnerSpaceId, resolvePlanningSpaceId } from "./planning.js";
import {
  copyRootMembersToSpace,
  countOwners,
  findSpaceMember,
  findUserByUsername,
  insertSpaceMember,
  listSpaceMembers,
  listInheritedSpaceMembers,
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
  type SpacePlanningInsert,
  type SpaceRow,
} from "./repository.js";

function planningForPreset(preset: SpacePreset | undefined): SpacePlanningInsert {
  if (preset === "project") {
    return { showBacklog: true, showBoard: true };
  }
  if (preset === "scrum") {
    return { showBacklog: true, showBoard: true, sprintingEnabled: true };
  }
  return {};
}

function needsProjectPlanning(preset: SpacePreset | undefined): boolean {
  return preset === "project" || preset === "scrum";
}

function addWeeks(from: Date, weeks: number): Date {
  return new Date(from.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

async function createUpcomingSprint(parent: SpaceRow, createdBy: UserId): Promise<SpaceRow> {
  const number = parent.nextSprintNumber;
  const created = await insertNestedSpace({
    title: `Sprint ${number}`,
    parentSpaceId: parent.id,
    rootSpaceId: parent.rootSpaceId ?? parent.id,
    createdBy,
    visibility: "public",
    planning: {
      sprintRole: "upcoming",
      sprintDurationWeeks:
        parent.sprintDurationWeeks === 1 || parent.sprintDurationWeeks === 4
          ? parent.sprintDurationWeeks
          : 2,
    },
  });
  await updateSpace(parent.id, {
    upcomingSprintId: created.id,
    nextSprintNumber: number + 1,
  });
  return created;
}

async function applyCreatedSpacePlanning(
  created: SpaceRow,
  preset: SpacePreset | undefined,
  userId: UserId,
): Promise<SpaceRow> {
  if (needsProjectPlanning(preset)) {
    await provisionProjectPlanning(created.id);
  } else if (created.parentSpaceId == null) {
    await provisionDefaultDocumentTypes(created.id);
  }
  if (preset === "scrum") {
    await createUpcomingSprint(created, userId);
    const refreshed = await findSpaceById(created.id);
    if (refreshed) return refreshed;
  }
  return created;
}

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
  const planning = planningForPreset(input.preset);

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
      planning,
    });

    if (visibility === "private") {
      await insertOwnerMembership({ spaceId: created.id, userId });
    }

    const ready = await applyCreatedSpacePlanning(created, input.preset, userId);
    return { ok: true as const, space: toSpaceSummary(ready) };
  }

  const visibility = input.visibility ?? "public";
  const created = await insertRootSpace({
    title: input.title,
    createdBy: userId,
    visibility,
    planning,
  });
  if (visibility === "private") {
    await insertOwnerMembership({ spaceId: created.id, userId });
  }

  const ready = await applyCreatedSpacePlanning(created, input.preset, userId);
  return { ok: true as const, space: toSpaceSummary(ready) };
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

  const planningSpaceId = await resolvePlanningSpaceId(spaceId);
  const artifactSpaceIds = [spaceId];
  if (row.sprintingEnabled) {
    if (row.activeSprintId) artifactSpaceIds.push(row.activeSprintId);
    if (row.upcomingSprintId) artifactSpaceIds.push(row.upcomingSprintId);
  }

  const [artifacts, members, assignableMembers, canManage, planning] = await Promise.all([
    artifactRepository.listArtifactSummariesInSpaces(artifactSpaceIds),
    listSpaceMembers(spaceId),
    listInheritedSpaceMembers(spaceId),
    canManageSpace(userId, spaceId),
    loadPlanningForSpace(planningSpaceId),
  ]);

  return {
    ok: true as const,
    space: toSpaceSummary(row),
    childSpaces: accessibleChildren.map(toSpaceSummary),
    artifacts,
    members: members.map(toSpaceMember),
    assignableMembers: assignableMembers.map(toSpaceMember),
    canManage,
    workflow: planning.workflow,
    documentTypes: planning.documentTypes,
  };
}

export async function addSpaceMember(userId: UserId, spaceId: SpaceId, input: AddSpaceMemberInput) {
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

export async function deleteSpaceMember(actorId: UserId, spaceId: SpaceId, memberUserId: UserId) {
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

async function updateDescendantRoots(spaceId: SpaceId, rootSpaceId: SpaceId | null): Promise<void> {
  const children = await listChildSpaces(spaceId);
  for (const child of children) {
    await updateSpace(child.id, { rootSpaceId });
    await updateDescendantRoots(child.id, rootSpaceId);
  }
}

async function isDescendant(ancestorId: SpaceId, candidateId: SpaceId): Promise<boolean> {
  let cursor = await findSpaceById(candidateId);
  while (cursor?.parentSpaceId) {
    if (cursor.parentSpaceId === ancestorId) return true;
    cursor = await findSpaceById(cursor.parentSpaceId);
  }
  return false;
}

async function reparentSpace(
  userId: UserId,
  spaceRow: SpaceRow,
  parentSpaceId: SpaceId | null,
): Promise<
  | { ok: true; space: SpaceRow }
  | { ok: false; reason: "forbidden" | "invalid_parent" | "not_found" }
> {
  if (spaceRow.parentSpaceId === parentSpaceId) {
    return { ok: true, space: spaceRow };
  }
  if (parentSpaceId === spaceRow.id) {
    return { ok: false, reason: "invalid_parent" };
  }

  if (parentSpaceId === null) {
    const updated = await updateSpace(spaceRow.id, { parentSpaceId: null, rootSpaceId: null });
    if (!updated) return { ok: false, reason: "not_found" };
    await updateDescendantRoots(spaceRow.id, updated.id);
    await enableMembership(updated);
    return { ok: true, space: updated };
  }

  const parent = await requireSpaceAccess(userId, parentSpaceId);
  if (!parent) return { ok: false, reason: "forbidden" };
  if (await isDescendant(spaceRow.id, parent.id)) {
    return { ok: false, reason: "invalid_parent" };
  }

  const nextRoot = parent.rootSpaceId ?? parent.id;
  const updated = await updateSpace(spaceRow.id, {
    parentSpaceId: parent.id,
    rootSpaceId: nextRoot,
  });
  if (!updated) return { ok: false, reason: "not_found" };
  await updateDescendantRoots(spaceRow.id, nextRoot);
  return { ok: true, space: updated };
}

export async function patchSpace(userId: UserId, spaceId: SpaceId, input: PatchSpaceInput) {
  let spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const hasTitle = input.title !== undefined;
  const hasIcon = input.icon !== undefined;
  const hasVisibility = input.visibility !== undefined;
  const hasParent = input.parentSpaceId !== undefined;

  if (!hasTitle && !hasIcon && !hasVisibility && !hasParent) {
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

  if (hasParent) {
    const reparented = await reparentSpace(userId, spaceRow, input.parentSpaceId ?? null);
    if (!reparented.ok) return reparented;
    spaceRow = reparented.space;
    if (!hasTitle && !hasIcon && !hasVisibility) {
      return { ok: true as const, space: toSpaceSummary(spaceRow) };
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

export async function enableSprints(userId: UserId, spaceId: SpaceId) {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  if (spaceRow.sprintRole != null) {
    return { ok: false as const, reason: "not_project" as const };
  }

  let current = spaceRow;
  if (!current.sprintingEnabled) {
    const updated = await updateSpace(spaceId, { sprintingEnabled: true });
    if (!updated) return { ok: false as const, reason: "not_found" as const };
    current = updated;
  }

  if (!current.upcomingSprintId) {
    await createUpcomingSprint(current, userId);
    const refreshed = await findSpaceById(spaceId);
    if (!refreshed) return { ok: false as const, reason: "not_found" as const };
    current = refreshed;
  }

  return { ok: true as const, space: toSpaceSummary(current) };
}

export async function startSprint(userId: UserId, spaceId: SpaceId) {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  if (!spaceRow.sprintingEnabled) {
    return { ok: false as const, reason: "sprints_disabled" as const };
  }
  if (spaceRow.activeSprintId) {
    return { ok: false as const, reason: "already_active" as const };
  }
  if (!spaceRow.upcomingSprintId) {
    return { ok: false as const, reason: "no_upcoming" as const };
  }

  const upcoming = await findSpaceById(spaceRow.upcomingSprintId);
  if (!upcoming) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const startedAt = new Date();
  const duration =
    spaceRow.sprintDurationWeeks === 1 || spaceRow.sprintDurationWeeks === 4
      ? spaceRow.sprintDurationWeeks
      : 2;

  await updateSpace(upcoming.id, {
    sprintRole: "active",
    sprintStartedAt: startedAt,
    sprintPlannedEndAt: addWeeks(startedAt, duration),
  });

  const parentAfterStart = await updateSpace(spaceId, {
    activeSprintId: upcoming.id,
    upcomingSprintId: null,
  });
  if (!parentAfterStart) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await createUpcomingSprint(parentAfterStart, userId);
  const refreshed = await findSpaceById(spaceId);
  if (!refreshed) {
    return { ok: false as const, reason: "not_found" as const };
  }
  return { ok: true as const, space: toSpaceSummary(refreshed) };
}

export async function completeSprint(userId: UserId, spaceId: SpaceId) {
  const spaceRow = await requireSpaceManagement(userId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  if (!spaceRow.activeSprintId) {
    return { ok: false as const, reason: "no_active" as const };
  }

  const active = await findSpaceById(spaceRow.activeSprintId);
  if (!active) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await updateSpace(active.id, {
    sprintRole: "past",
    sprintCompletedAt: new Date(),
  });

  const updated = await updateSpace(spaceId, { activeSprintId: null });
  if (!updated) {
    return { ok: false as const, reason: "not_found" as const };
  }
  return { ok: true as const, space: toSpaceSummary(updated) };
}
