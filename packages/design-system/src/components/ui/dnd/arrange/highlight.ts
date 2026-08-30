import { pointInRect } from "../geometry"
import type { DndId, DndPoint, TargetSnapshot } from "../types"

export function hitTestHighlight(
  targets: TargetSnapshot[],
  pointer: DndPoint,
): { targetId: DndId } | null {
  const hit = [...targets].reverse().find((target) => pointInRect(pointer, target))
  return hit ? { targetId: hit.id } : null
}
