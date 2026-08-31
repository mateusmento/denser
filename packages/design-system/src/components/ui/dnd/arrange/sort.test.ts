import { expect, test } from "vitest";
import type { ItemSnapshot, ListSnapshot } from "../types";
import { applySortCommit, computeSortTransforms, hitTestSort, placeholderRect } from "./sort";

function item(id: string, listId: string, index: number, y: number, height = 20): ItemSnapshot {
  return { id, listId, index, x: 0, y, width: 80, height };
}

const column: ListSnapshot = {
  id: "todo",
  orientation: "vertical",
  x: 0,
  y: 0,
  width: 80,
  height: 200,
  gap: 8,
};

const cards = [
  item("a", "todo", 0, 0),
  item("b", "todo", 1, 28),
  item("c", "todo", 2, 56),
  item("d", "todo", 3, 84),
];

test("hitTestSort returns the remaining-list insert index", () => {
  expect(hitTestSort(cards, [column], { x: 10, y: 5 }, ["b"])).toEqual({
    listId: "todo",
    index: 0,
  });
  expect(hitTestSort(cards, [column], { x: 10, y: 66 }, ["b"])).toEqual({
    listId: "todo",
    index: 2,
  });
  expect(hitTestSort(cards, [column], { x: 10, y: 180 }, ["b"])).toEqual({
    listId: "todo",
    index: 3,
  });
});

test("same-list drag down shifts items between source and insert up", () => {
  const transforms = computeSortTransforms(cards, "b", { listId: "todo", index: 2 }, "vertical");
  expect(transforms.get("c")?.y).toBe(-28);
  expect(transforms.has("a")).toBe(false);
  expect(transforms.has("d")).toBe(false);
});

test("same-list drag up shifts items between insert and source down", () => {
  const transforms = computeSortTransforms(cards, "b", { listId: "todo", index: 0 }, "vertical");
  expect(transforms.get("a")?.y).toBe(28);
  expect(transforms.has("c")).toBe(false);
});

test("same-list same slot is a no-op", () => {
  const transforms = computeSortTransforms(cards, "b", { listId: "todo", index: 1 }, "vertical");
  expect(transforms.size).toBe(0);
});

test("leaving a list closes the source gap", () => {
  const transforms = computeSortTransforms(cards, "b", null, "vertical");
  expect(transforms.get("c")?.y).toBe(-28);
  expect(transforms.get("d")?.y).toBe(-28);
  expect(transforms.has("a")).toBe(false);
});

test("entering another list opens a slot and closes the source", () => {
  const other = [item("x", "done", 0, 0), item("y", "done", 1, 28)];
  const transforms = computeSortTransforms(
    [...cards, ...other],
    "b",
    { listId: "done", index: 1 },
    "vertical",
  );
  expect(transforms.get("c")?.y).toBe(-28);
  expect(transforms.get("y")?.y).toBe(28);
  expect(transforms.has("x")).toBe(false);
});

test("placeholder after a single item uses the list gap", () => {
  const done: ListSnapshot = { ...column, id: "done" };
  const only = [item("x", "done", 0, 0)];
  const source = item("b", "todo", 1, 28);
  expect(placeholderRect(only, source, { listId: "done", index: 1 }, done, "vertical")).toEqual({
    x: 0,
    y: 28,
    width: 80,
    height: 20,
  });
});

test("entering a one-item list opens a slot that includes the list gap", () => {
  const done: ListSnapshot = { ...column, id: "done" };
  const transforms = computeSortTransforms(
    [...cards, item("x", "done", 0, 0)],
    "b",
    { listId: "done", index: 0 },
    "vertical",
    [column, done],
  );
  expect(transforms.get("x")?.y).toBe(28);
});

test("placeholder sits in the opened slot", () => {
  const same = placeholderRect(cards, cards[1]!, { listId: "todo", index: 1 }, column, "vertical");
  expect(same).toEqual({ x: 0, y: 28, width: 80, height: 20 });

  const down = placeholderRect(cards, cards[1]!, { listId: "todo", index: 2 }, column, "vertical");
  expect(down).toEqual({ x: 0, y: 56, width: 80, height: 20 });
});

test("same-list append uses the last remaining item's vacated box, not a slot after it", () => {
  const three = [item("a", "todo", 0, 0), item("b", "todo", 1, 28), item("c", "todo", 2, 56)];
  const atEnd = placeholderRect(three, three[1]!, { listId: "todo", index: 2 }, column, "vertical");
  expect(atEnd).toEqual({ x: 0, y: 56, width: 80, height: 20 });

  const fourEnd = placeholderRect(
    cards,
    cards[1]!,
    { listId: "todo", index: 3 },
    column,
    "vertical",
  );
  expect(fourEnd).toEqual({ x: 0, y: 84, width: 80, height: 20 });
});

test("variable heights: dragging a short card up shifts taller cards down correctly", () => {
  // A (height 40, y: 0)
  // B (height 60, y: 48)  [0 + 40 + 8]
  // C (height 80, y: 116) [48 + 60 + 8]
  // D (height 30, y: 204) [116 + 80 + 8]
  const varCards = [
    item("a", "todo", 0, 0, 40),
    item("b", "todo", 1, 48, 60),
    item("c", "todo", 2, 116, 80),
    item("d", "todo", 3, 204, 30),
  ];

  // Drag D (height 30) up to index 1 (between A and B)
  const transforms = computeSortTransforms(varCards, "d", { listId: "todo", index: 1 }, "vertical");
  // B and C should shift down by D's height (30) + gap (8) = 38
  expect(transforms.get("a")?.y ?? 0).toBe(0);
  expect(transforms.get("b")?.y).toBe(38);
  expect(transforms.get("c")?.y).toBe(38);

  const placeholder = placeholderRect(
    varCards,
    varCards[3]!,
    { listId: "todo", index: 1 },
    column,
    "vertical",
  );
  // Placeholder should sit at y = 0 + 40 + 8 = 48
  expect(placeholder).toEqual({ x: 0, y: 48, width: 80, height: 30 });
});

test("variable heights: dragging a tall card down shifts taller and shorter cards up correctly", () => {
  const varCards = [
    item("a", "todo", 0, 0, 40),
    item("b", "todo", 1, 48, 60),
    item("c", "todo", 2, 116, 80),
    item("d", "todo", 3, 204, 30),
  ];

  // Drag B (height 60) down to index 2 (between C and D)
  const transforms = computeSortTransforms(varCards, "b", { listId: "todo", index: 2 }, "vertical");
  // C (height 80) should shift up to take B's place at y=48 (48 - 116 = -68)
  expect(transforms.get("a")?.y ?? 0).toBe(0);
  expect(transforms.get("c")?.y).toBe(-68);
  expect(transforms.get("d")?.y ?? 0).toBe(0);

  const placeholder = placeholderRect(
    varCards,
    varCards[1]!,
    { listId: "todo", index: 2 },
    column,
    "vertical",
  );
  // Placeholder should sit right after shifted C (48 + 80 + 8 = 136)
  expect(placeholder).toEqual({ x: 0, y: 136, width: 80, height: 60 });
});

test("applySortCommit splices the remaining-list index", () => {
  const lists = {
    todo: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    done: [{ id: "x" }],
  };
  const reordered = applySortCommit(lists, "b", "todo", { listId: "todo", index: 2 });
  expect(reordered.todo?.map((entry) => entry.id)).toEqual(["a", "c", "b", "d"]);

  const moved = applySortCommit(lists, "b", "todo", { listId: "done", index: 0 });
  expect(moved.todo?.map((entry) => entry.id)).toEqual(["a", "c", "d"]);
  expect(moved.done?.map((entry) => entry.id)).toEqual(["b", "x"]);
});
