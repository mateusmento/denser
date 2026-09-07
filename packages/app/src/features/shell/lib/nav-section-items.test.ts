import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { overflowNavLabel, truncateInSpaceNavItems } from "./nav-section-items.ts";
import type { WorkspaceNavLink } from "../types.ts";

const scopeId = "00000000-0000-4000-8000-000000000010" as SpaceId;

function link(id: string, label: string): WorkspaceNavLink {
  return {
    id,
    label,
    to: { name: "space", params: { spaceId: id as SpaceId } },
    isActive: false,
  };
}

test("truncateInSpaceNavItems returns all items when within limit", () => {
  const items = [link("1", "One"), link("2", "Two")];
  const result = truncateInSpaceNavItems(items, {});
  assert.deepEqual(result.visible, items);
  assert.deepEqual(result.overflow, []);
});

test("truncateInSpaceNavItems keeps first seven and puts rest in overflow", () => {
  const items = Array.from({ length: 10 }, (_, index) => link(String(index), `Item ${index}`));
  const result = truncateInSpaceNavItems(items, {});
  assert.equal(result.visible.length, 7);
  assert.equal(result.visible[0]?.id, "0");
  assert.equal(result.overflow.length, 3);
  assert.equal(result.overflow[0]?.id, "7");
});

test("truncateInSpaceNavItems pins an active item beyond the limit", () => {
  const items = Array.from({ length: 10 }, (_, index) => link(String(index), `Item ${index}`));
  const result = truncateInSpaceNavItems(items, {
    activeArtifactId: "8" as ArtifactId,
  });
  assert.equal(result.visible.length, 7);
  assert.equal(result.visible.at(-1)?.id, "8");
  assert.equal(result.overflow.length, 3);
  assert.ok(!result.overflow.some((item) => item.id === "8"));
});

test("overflowNavLabel uses singular copy for one hidden item", () => {
  assert.equal(overflowNavLabel(1, "Acme"), "See 1 more in Acme");
  assert.equal(overflowNavLabel(3, "Acme"), "See all in Acme");
});
