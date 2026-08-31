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

function projectList(
  items: ItemSnapshot[],
  listId: DndId,
  source: ItemSnapshot,
  insertIndex: number | null,
  orientation: DndAxis,
  listSnapshot?: ListSnapshot,
): { transforms: Map<DndId, DndDelta>; placeholderRect: DndRect | null } {
  const allOriginal = items
    .filter((item) => item.listId === listId)
    .sort((a, b) => a.index - b.index);
  const isVertical = orientation !== "horizontal";

  if (allOriginal.length === 0 && insertIndex === null) {
    return { transforms: new Map(), placeholderRect: null };
  }

  const gap = listGap(allOriginal, orientation, listSnapshot?.gap ?? 0);

  const originPos =
    allOriginal.length > 0
      ? Math.min(...allOriginal.map((item) => (isVertical ? item.y : item.x)))
      : isVertical
        ? (listSnapshot?.y ?? 0)
        : (listSnapshot?.x ?? 0);

  const originCross =
    allOriginal.length > 0
      ? isVertical
        ? allOriginal[0]!.x
        : allOriginal[0]!.y
      : isVertical
        ? (listSnapshot?.x ?? 0)
        : (listSnapshot?.y ?? 0);

  const members = membersOf(items, listId, [source.id]);

  type Entry = { kind: "item"; item: ItemSnapshot } | { kind: "placeholder" };
  const sequence: Entry[] = [];

  if (insertIndex !== null) {
    const clamped = Math.max(0, Math.min(insertIndex, members.length));
    for (let i = 0; i < members.length; i++) {
      if (i === clamped) {
        sequence.push({ kind: "placeholder" });
      }
      sequence.push({ kind: "item", item: members[i]! });
    }
    if (clamped === members.length) {
      sequence.push({ kind: "placeholder" });
    }
  } else {
    for (const member of members) {
      sequence.push({ kind: "item", item: member });
    }
  }

  let currentPos = originPos;
  let placeholder: DndRect | null = null;
  const transforms = new Map<DndId, DndDelta>();

  for (const entry of sequence) {
    if (entry.kind === "placeholder") {
      const width = source.width;
      const height = source.height;
      if (isVertical) {
        placeholder = {
          x: originCross,
          y: currentPos,
          width,
          height,
        };
        currentPos += height + gap;
      } else {
        placeholder = {
          x: currentPos,
          y: originCross,
          width,
          height,
        };
        currentPos += width + gap;
      }
    } else {
      const it = entry.item;
      if (isVertical) {
        const deltaY = currentPos - it.y;
        if (Math.abs(deltaY) >= 0.5) {
          transforms.set(it.id, { x: 0, y: deltaY });
        }
        currentPos += it.height + gap;
      } else {
        const deltaX = currentPos - it.x;
        if (Math.abs(deltaX) >= 0.5) {
          transforms.set(it.id, { x: deltaX, y: 0 });
        }
        currentPos += it.width + gap;
      }
    }
  }

  return { transforms, placeholderRect: placeholder };
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

  const sourceListSnapshot = lists.find((l) => l.id === source.listId);
  const sourceOrientation = sourceListSnapshot?.orientation ?? orientation;

  if (!over) {
    const { transforms } = projectList(
      items,
      source.listId,
      source,
      null,
      sourceOrientation,
      sourceListSnapshot,
    );
    return transforms;
  }

  if (over.listId === source.listId) {
    const { transforms } = projectList(
      items,
      source.listId,
      source,
      over.index,
      sourceOrientation,
      sourceListSnapshot,
    );
    return transforms;
  }

  const targetListSnapshot = lists.find((l) => l.id === over.listId);
  const targetOrientation = targetListSnapshot?.orientation ?? orientation;

  const sourceProjected = projectList(
    items,
    source.listId,
    source,
    null,
    sourceOrientation,
    sourceListSnapshot,
  );
  const targetProjected = projectList(
    items,
    over.listId,
    source,
    over.index,
    targetOrientation,
    targetListSnapshot,
  );

  for (const [id, delta] of sourceProjected.transforms) {
    result.set(id, delta);
  }
  for (const [id, delta] of targetProjected.transforms) {
    result.set(id, delta);
  }

  return result;
}

export function placeholderRect(
  items: ItemSnapshot[],
  source: ItemSnapshot,
  over: SortOver,
  listRect: ListSnapshot,
  orientation: DndAxis,
  lists: ListSnapshot[] = [],
): DndRect {
  const targetListSnapshot = lists.find((l) => l.id === over.listId) ?? listRect;
  const targetOrientation = targetListSnapshot.orientation ?? orientation;

  const projected = projectList(
    items,
    over.listId,
    source,
    over.index,
    targetOrientation,
    targetListSnapshot,
  );

  if (projected.placeholderRect) {
    return projected.placeholderRect;
  }

  return {
    x: targetListSnapshot.x,
    y: targetListSnapshot.y,
    width: source.width,
    height: source.height,
  };
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
