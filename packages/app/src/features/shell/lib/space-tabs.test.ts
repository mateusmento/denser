import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSpaceTabHostId } from "./space-tabs.ts";

test("personal home has no tab host even if a workspace host is persisted", () => {
  assert.equal(
    resolveSpaceTabHostId({
      routeName: "home",
      activeTabHostId: "00000000-0000-4000-8000-000000000010",
    }),
    undefined,
  );
});

test("a space route keeps the persisted workspace tab host", () => {
  assert.equal(
    resolveSpaceTabHostId({
      routeName: "space",
      routeSpaceId: "00000000-0000-4000-8000-000000000011",
      activeTabHostId: "00000000-0000-4000-8000-000000000010",
    }),
    "00000000-0000-4000-8000-000000000010",
  );
});
