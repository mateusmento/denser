import type { DndDelta, DndId, DndRect } from "./types";

export function settleFromRect(
  lastOverlay: DndRect | undefined,
  preCommit: DndRect | undefined,
  destination: DndRect,
): DndRect {
  return lastOverlay ?? preCommit ?? destination;
}

export function invertSettleDelta(from: DndRect, to: DndRect): DndDelta {
  return { x: from.x - to.x, y: from.y - to.y };
}

export function settleOrigins(
  movingIds: DndId[],
  lastOverlays: Map<DndId, DndRect>,
  preCommitRects: Map<DndId, DndRect>,
  destinations: Map<DndId, DndRect>,
): Map<DndId, DndDelta> {
  const origins = new Map<DndId, DndDelta>();
  for (const id of movingIds) {
    const to = destinations.get(id);
    if (!to) continue;
    const from = settleFromRect(lastOverlays.get(id), preCommitRects.get(id), to);
    origins.set(id, invertSettleDelta(from, to));
  }
  return origins;
}

export function dropRegistration<T extends { element: unknown }>(
  registry: Map<DndId, T>,
  id: DndId,
  registration: T,
) {
  if (registry.get(id)?.element === registration.element) registry.delete(id);
}
