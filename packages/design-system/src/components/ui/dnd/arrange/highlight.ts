import { pointInRect } from "../geometry";
import type { DndId, DndPoint, TargetSnapshot } from "../types";

export function hitTestHighlight(
  targets: TargetSnapshot[],
  pointer: DndPoint,
  sourceIds: readonly DndId[] = [],
): { targetId: DndId } | null {
  const hit = [...targets]
    .reverse()
    .find((target) => !sourceIds.includes(target.id) && pointInRect(pointer, target));
  return hit ? { targetId: hit.id } : null;
}
