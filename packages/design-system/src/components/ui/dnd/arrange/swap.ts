import { pointInRect } from "../geometry";
import type { DndDelta, DndId, DndPoint, DndSwapMode, SlotSnapshot } from "../types";

export type SlotItemMap = Record<DndId, DndId | null>;

export function hitTestSwap(slots: SlotSnapshot[], pointer: DndPoint): { slotId: DndId } | null {
  const hit = slots.find((slot) => pointInRect(pointer, slot));
  return hit ? { slotId: hit.id } : null;
}

export function previewSwapMap(
  slotItemMap: SlotItemMap,
  sourceSlotId: DndId,
  overSlotId: DndId | null,
  mode: DndSwapMode,
): SlotItemMap {
  if (mode === "drop" || !overSlotId || overSlotId === sourceSlotId) return slotItemMap;

  return {
    ...slotItemMap,
    [sourceSlotId]: slotItemMap[overSlotId] ?? null,
    [overSlotId]: slotItemMap[sourceSlotId] ?? null,
  };
}

export function commitSwapMap(
  slotItemMap: SlotItemMap,
  sourceSlotId: DndId,
  overSlotId: DndId,
): SlotItemMap {
  if (overSlotId === sourceSlotId) return slotItemMap;

  return {
    ...slotItemMap,
    [sourceSlotId]: slotItemMap[overSlotId] ?? null,
    [overSlotId]: slotItemMap[sourceSlotId] ?? null,
  };
}

export function computeSwapTransforms(
  slots: SlotSnapshot[],
  slotItemMap: SlotItemMap,
  previewMap: SlotItemMap,
): Map<DndId, DndDelta> {
  const result = new Map<DndId, DndDelta>();
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));

  for (const [slotId, itemId] of Object.entries(slotItemMap)) {
    if (!itemId) continue;
    const previewSlotId = Object.entries(previewMap).find(([, id]) => id === itemId)?.[0];
    if (!previewSlotId || previewSlotId === slotId) continue;
    const from = slotById.get(slotId);
    const to = slotById.get(previewSlotId);
    if (!from || !to) continue;
    result.set(itemId, { x: to.x - from.x, y: to.y - from.y });
  }

  return result;
}

export function slotIdForItem(slotItemMap: SlotItemMap, itemId: DndId): DndId | null {
  return Object.entries(slotItemMap).find(([, id]) => id === itemId)?.[0] ?? null;
}
