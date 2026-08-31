import assert from "node:assert/strict";
import { test } from "node:test";
import {
  childrenForLocation,
  destinationForLocation,
  matchesSearch,
  MOVE_HOME,
  parentLocation,
  titleForLocation,
  type SpaceMoveNode,
} from "./space-move-menu.ts";

const spaces: SpaceMoveNode[] = [
  { id: "acme", title: "Acme", parentId: null },
  { id: "eng", title: "Engineering", parentId: "acme" },
  { id: "design", title: "Design", parentId: "acme" },
];

test("home lists root spaces", () => {
  assert.deepEqual(
    childrenForLocation(spaces, MOVE_HOME).map((entry) => entry.title),
    ["Acme"],
  );
});

test("a space lists its children and can go back to home", () => {
  assert.deepEqual(
    childrenForLocation(spaces, "acme").map((entry) => entry.title),
    ["Engineering", "Design"],
  );
  assert.equal(parentLocation("acme", spaces), MOVE_HOME);
  assert.equal(parentLocation("eng", spaces), "acme");
  assert.equal(parentLocation(MOVE_HOME, spaces), MOVE_HOME);
});

test("blocked ids are omitted from children", () => {
  assert.deepEqual(
    childrenForLocation(spaces, "acme", new Set(["eng"])).map((entry) => entry.id),
    ["design"],
  );
});

test("every location is a destination", () => {
  assert.deepEqual(destinationForLocation(MOVE_HOME), { kind: "home" });
  assert.deepEqual(destinationForLocation("eng"), { kind: "space", spaceId: "eng" });
});

test("title follows the current location", () => {
  assert.equal(titleForLocation(MOVE_HOME, spaces), "Home");
  assert.equal(titleForLocation("acme", spaces), "Acme");
  assert.equal(titleForLocation("missing", spaces), "Home");
});

test("search matches titles case-insensitively", () => {
  assert.equal(matchesSearch("Engineering", "eng"), true);
  assert.equal(matchesSearch("Engineering", "design"), false);
});
