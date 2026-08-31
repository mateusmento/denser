import { listGap, pointInRect } from "../geometry";
import type {
  DndAxis,
  DndDelta,
  DndId,
  DndPoint,
  DndRect,
  ItemSnapshot,
  ListSnapshot,
} from "../types";

export type SortOver = { listId: DndId; index: number };

function axisSize(rect: DndRect, orientation: DndAxis): number {
  return orientation === "vertical" ? rect.height : rect.width;
}

function asDelta(amount: number, orientation: DndAxis): DndDelta {
  return orientation === "vertical" ? { x: 0, y: amount } : { x: amount, y: 0 };
}

function membersOf(
  items: ItemSnapshot[],
  listId: DndId,
  sourceIds: Iterable<DndId>,
): ItemSnapshot[] {
  const hidden = new Set(sourceIds);
  return items
    .filter((item) => item.listId === listId && !hidden.has(item.id))
    .sort((a, b) => a.index - b.index);
}

export function hitTestSort(
  items: ItemSnapshot[],
  lists: ListSnapshot[],
  pointer: DndPoint,
  sourceIds: DndId[],
): SortOver | null {
  const list = lists.find((entry) => pointInRect(pointer, entry));
  if (!list) return null;

  const members = membersOf(items, list.id, sourceIds);
  const vertical = list.orientation !== "horizontal";

  for (const [index, item] of members.entries()) {
    const mid = vertical ? item.y + item.height / 2 : item.x + item.width / 2;
    const value = vertical ? pointer.y : pointer.x;
    if (value < mid) return { listId: list.id, index };
  }

  return { listId: list.id, index: members.length };
}

function declaredGap(lists: ListSnapshot[], listId: DndId | undefined) {
  return lists.find((list) => list.id === listId)?.gap ?? 0;
}

export function computeSortTransforms(
  items: ItemSnapshot[],
  sourceId: DndId,
  over: SortOver | null,
  orientation: DndAxis,
  lists: ListSnapshot[] = [],
): Map<DndId, DndDelta> {
  const source = items.find((item) => item.id === sourceId);
  const result = new Map<DndId, DndDelta>();
  if (!source?.listId) return result;

  const sourceGap = listGap(
    items.filter((item) => item.listId === source.listId),
    orientation,
    declaredGap(lists, source.listId),
  );
  const closeSize = axisSize(source, orientation) + sourceGap;

  if (!over) {
    for (const item of items) {
      if (item.id === sourceId || item.listId !== source.listId) continue;
      if (item.index > source.index) result.set(item.id, asDelta(-closeSize, orientation));
    }
    return result;
  }

  if (over.listId === source.listId) {
    const from = source.index;
    const insert = over.index;
    if (insert < from) {
      for (const item of items) {
        if (item.id === sourceId || item.listId !== source.listId) continue;
        if (item.index >= insert && item.index < from)
          result.set(item.id, asDelta(closeSize, orientation));
      }
    } else if (insert > from) {
      for (const item of items) {
        if (item.id === sourceId || item.listId !== source.listId) continue;
        if (item.index > from && item.index <= insert)
          result.set(item.id, asDelta(-closeSize, orientation));
      }
    }
    return result;
  }

  const targetItems = items.filter((item) => item.listId === over.listId);
  const targetOrientation = orientation;
  const openSize =
    axisSize(source, targetOrientation) +
    listGap(targetItems, targetOrientation, declaredGap(lists, over.listId));

  for (const item of items) {
    if (item.id === sourceId) continue;
    if (item.listId === source.listId && item.index > source.index)
      result.set(item.id, asDelta(-closeSize, orientation));
    if (item.listId === over.listId && item.index >= over.index)
      result.set(item.id, asDelta(openSize, targetOrientation));
  }

  return result;
}

export function placeholderRect(
  items: ItemSnapshot[],
  source: ItemSnapshot,
  over: SortOver,
  listRect: ListSnapshot,
  orientation: DndAxis,
): DndRect {
  const size = { width: source.width, height: source.height };
  const members = membersOf(items, over.listId, [source.id]);
  const gap = listGap(
    items.filter((item) => item.listId === over.listId),
    orientation,
    listRect.gap,
  );

  if (members.length === 0) return { x: listRect.x, y: listRect.y, ...size };

  if (over.listId === source.listId && over.index === source.index)
    return { x: source.x, y: source.y, ...size };

  if (over.index >= members.length) {
    const last = members[members.length - 1];
    if (!last) return { x: listRect.x, y: listRect.y, ...size };
    const draggingDownInSource = over.listId === source.listId && source.index < over.index;
    if (draggingDownInSource) return { x: last.x, y: last.y, ...size };
    return orientation === "vertical"
      ? { x: last.x, y: last.y + last.height + gap, ...size }
      : { x: last.x + last.width + gap, y: last.y, ...size };
  }

  if (over.listId === source.listId && over.index > source.index) {
    const shifted = members[over.index - 1];
    if (shifted) return { x: shifted.x, y: shifted.y, ...size };
  }

  const at = members[over.index];
  if (!at) return { x: listRect.x, y: listRect.y, ...size };
  return { x: at.x, y: at.y, ...size };
}

export function applySortCommit<T extends { id: DndId }>(
  lists: Record<DndId, T[]>,
  sourceId: DndId,
  fromListId: DndId,
  over: SortOver,
): Record<DndId, T[]> {
  const next: Record<DndId, T[]> = Object.fromEntries(
    Object.entries(lists).map(([id, entries]) => [id, [...entries]]),
  );
  const fromList = next[fromListId];
  if (!fromList) return lists;
  const fromIndex = fromList.findIndex((item) => item.id === sourceId);
  if (fromIndex < 0) return lists;
  const [item] = fromList.splice(fromIndex, 1);
  if (!item) return lists;
  const toList = next[over.listId] ?? [];
  next[over.listId] = toList;
  toList.splice(over.index, 0, item);
  return next;
}
