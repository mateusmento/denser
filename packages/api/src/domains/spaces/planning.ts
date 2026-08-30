import type { SpaceId } from "@denser/contracts";
import type { SpaceRow } from "./repository.js";

export function planningOwnerSpaceId(row: SpaceRow): SpaceId {
  if (row.sprintRole != null && row.parentSpaceId) return row.parentSpaceId;
  return row.id;
}

export function isDocumentOnBoard(documentSpaceId: SpaceId | null, owner: SpaceRow): boolean {
  if (!documentSpaceId) return false;
  if (owner.sprintingEnabled) return owner.activeSprintId === documentSpaceId;
  return owner.id === documentSpaceId;
}
