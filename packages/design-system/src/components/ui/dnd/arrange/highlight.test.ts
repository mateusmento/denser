import { expect, test } from "vitest";
import { hitTestHighlight } from "./highlight";

test("hitTestHighlight returns the topmost target under the pointer", () => {
  const targets = [
    { id: "folder-a", x: 0, y: 0, width: 80, height: 80 },
    { id: "folder-b", x: 100, y: 0, width: 80, height: 80 },
  ];
  expect(hitTestHighlight(targets, { x: 120, y: 20 })).toEqual({ targetId: "folder-b" });
  expect(hitTestHighlight(targets, { x: 400, y: 20 })).toBeNull();
});

test("hitTestHighlight ignores targets contained in sourceIds", () => {
  const targets = [
    { id: "folder-a", x: 0, y: 0, width: 80, height: 80 },
    { id: "folder-b", x: 100, y: 0, width: 80, height: 80 },
  ];
  expect(hitTestHighlight(targets, { x: 120, y: 20 }, ["folder-b"])).toBeNull();
});
