import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { moveStoredTab, resolveSpaceTabHostId, type StoredSpaceTab } from "./space-tabs.ts";

test("personal home has no tab host even if a workspace host is persisted", () => {
  assert.equal(
    resolveSpaceTabHostId({
      routeName: "home",
      activeTabHostId: "00000000-0000-4000-8000-000000000010",
    }),
    undefined,
  );
});

test("moveStoredTab splices a working tab to the drop index", () => {
  const docA = "00000000-0000-4000-8000-000000000021" as ArtifactId;
  const docB = "00000000-0000-4000-8000-000000000020" as ArtifactId;
  const space = "00000000-0000-4000-8000-000000000011" as SpaceId;
  const tabs: StoredSpaceTab[] = [
    { kind: "artifact", artifactId: docA, artifactKind: "document" },
    { kind: "artifact", artifactId: docB, artifactKind: "document" },
    { kind: "space", spaceId: space },
  ];
  const reordered = moveStoredTab(tabs, "artifact:00000000-0000-4000-8000-000000000021", 2);
  assert.deepEqual(
    reordered.map((tab) => ("artifactId" in tab ? tab.artifactId : tab.spaceId)),
    [
      "00000000-0000-4000-8000-000000000020",
      "00000000-0000-4000-8000-000000000011",
      "00000000-0000-4000-8000-000000000021",
    ],
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
