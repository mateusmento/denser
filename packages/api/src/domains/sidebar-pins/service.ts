import type {
  SidebarPinDto,
  SidebarSectionItemLimit,
  SidebarSectionPreferenceDto,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { canAccessSpace, requireSpaceAccess } from "../tenancy/access.js";
import { toSpaceSummary } from "../spaces/mapper.js";
import * as sidebarPinsRepository from "./repository.js";

function toPinDto(
  row: sidebarPinsRepository.SpaceSidebarPinRow,
  spaceRow: NonNullable<Awaited<ReturnType<typeof sidebarPinsRepository.findSpaceRow>>>,
): SidebarPinDto {
  return {
    spaceId: row.spaceId,
    pinnedAt: row.pinnedAt.toISOString(),
    space: toSpaceSummary(spaceRow),
  };
}

function toPreferenceDto(
  row: sidebarPinsRepository.SidebarSectionPreferenceRow,
): SidebarSectionPreferenceDto {
  return {
    spaceId: row.spaceId,
    itemLimit: row.itemLimit as SidebarSectionItemLimit,
  };
}

function belongsToRootSpace(
  spaceRow: NonNullable<Awaited<ReturnType<typeof sidebarPinsRepository.findSpaceRow>>>,
  rootSpaceId: SpaceId,
): boolean {
  return spaceRow.id === rootSpaceId || spaceRow.rootSpaceId === rootSpaceId;
}

async function requireTargetSpace(
  userId: UserId,
  rootSpaceId: SpaceId,
  spaceId: SpaceId,
) {
  const spaceRow = await sidebarPinsRepository.findSpaceRow(spaceId);
  if (!spaceRow || !belongsToRootSpace(spaceRow, rootSpaceId)) {
    return null;
  }
  if (!(await canAccessSpace(userId, spaceId))) {
    return null;
  }
  return spaceRow;
}

export async function listSidebarPins(userId: UserId, rootSpaceId: SpaceId) {
  const root = await requireSpaceAccess(userId, rootSpaceId);
  if (!root) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await sidebarPinsRepository.listPinsForUser(userId, rootSpaceId);
  const pins: SidebarPinDto[] = [];

  for (const row of rows) {
    const spaceRow = await sidebarPinsRepository.findSpaceRow(row.spaceId);
    if (!spaceRow) continue;
    if (!(await canAccessSpace(userId, row.spaceId))) continue;
    pins.push(toPinDto(row, spaceRow));
  }

  return { ok: true as const, pins };
}

export async function pinSidebarSpace(userId: UserId, rootSpaceId: SpaceId, spaceId: SpaceId) {
  const root = await requireSpaceAccess(userId, rootSpaceId);
  if (!root) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const spaceRow = await requireTargetSpace(userId, rootSpaceId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "space_not_found" as const };
  }

  const existing = await sidebarPinsRepository.findPin(userId, rootSpaceId, spaceId);
  const row = existing ?? await sidebarPinsRepository.insertPin({
    userId,
    rootSpaceId,
    spaceId,
  });

  return {
    ok: true as const,
    pin: toPinDto(row, spaceRow),
    created: !existing,
  };
}

export async function unpinSidebarSpace(userId: UserId, rootSpaceId: SpaceId, spaceId: SpaceId) {
  const root = await requireSpaceAccess(userId, rootSpaceId);
  if (!root) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const removed = await sidebarPinsRepository.deletePin(userId, rootSpaceId, spaceId);
  if (!removed) {
    return { ok: false as const, reason: "pin_not_found" as const };
  }

  return { ok: true as const };
}

export async function listSidebarSectionPreferences(userId: UserId, rootSpaceId: SpaceId) {
  const root = await requireSpaceAccess(userId, rootSpaceId);
  if (!root) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await sidebarPinsRepository.listSectionPreferencesForUser(userId, rootSpaceId);
  const preferences: SidebarSectionPreferenceDto[] = [];

  for (const row of rows) {
    if (!(await canAccessSpace(userId, row.spaceId))) continue;
    preferences.push(toPreferenceDto(row));
  }

  return { ok: true as const, preferences };
}

export async function putSidebarSectionPreference(
  userId: UserId,
  rootSpaceId: SpaceId,
  spaceId: SpaceId,
  itemLimit: SidebarSectionItemLimit,
) {
  const root = await requireSpaceAccess(userId, rootSpaceId);
  if (!root) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const spaceRow = await requireTargetSpace(userId, rootSpaceId, spaceId);
  if (!spaceRow) {
    return { ok: false as const, reason: "space_not_found" as const };
  }

  const row = await sidebarPinsRepository.upsertSectionPreference({
    userId,
    rootSpaceId,
    spaceId,
    itemLimit,
  });

  return { ok: true as const, preference: toPreferenceDto(row) };
}
