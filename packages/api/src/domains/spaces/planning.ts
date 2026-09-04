import type { SpaceId } from "@denser/contracts";
import { findSpaceById, type SpaceRow } from "./repository.js";
import {
  listDocumentTypesForSpace,
  provisionDefaultDocumentTypes,
} from "../workflows/repository.js";

export function planningOwnerSpaceId(row: SpaceRow): SpaceId {
  if (row.sprintRole != null && row.parentSpaceId) return row.parentSpaceId;
  return row.id;
}

/** Nearest ancestor (or self) that owns document types / workflows. */
export async function resolvePlanningSpaceId(startSpaceId: SpaceId): Promise<SpaceId> {
  let current = await findSpaceById(startSpaceId);
  if (!current) return startSpaceId;

  const visited = new Set<SpaceId>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const types = await listDocumentTypesForSpace(current.id);
    if (types.length > 0) return current.id;

    if (current.sprintRole != null && current.parentSpaceId) {
      current = await findSpaceById(current.parentSpaceId);
      continue;
    }

    if (!current.parentSpaceId) break;
    current = await findSpaceById(current.parentSpaceId);
  }

  const start = await findSpaceById(startSpaceId);
  if (start?.parentSpaceId == null) {
    await provisionDefaultDocumentTypes(startSpaceId);
  }
  return startSpaceId;
}

export function isDocumentOnBoard(documentSpaceId: SpaceId | null, owner: SpaceRow): boolean {
  if (!documentSpaceId) return false;
  if (owner.sprintingEnabled) return owner.activeSprintId === documentSpaceId;
  return owner.id === documentSpaceId;
}
