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
