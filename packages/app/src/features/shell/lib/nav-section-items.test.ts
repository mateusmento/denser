import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { truncateInSpaceNavItems } from "./nav-section-items.ts";
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
  const result = truncateInSpaceNavItems(items, {
    scopeSpaceId: scopeId,
    scopeSpaceTitle: "Acme",
  });
  assert.deepEqual(result.items, items);
  assert.equal(result.seeAllLink, undefined);
});

test("truncateInSpaceNavItems keeps first seven and adds see-all link", () => {
  const items = Array.from({ length: 10 }, (_, index) => link(String(index), `Item ${index}`));
  const result = truncateInSpaceNavItems(items, {
    scopeSpaceId: scopeId,
    scopeSpaceTitle: "Acme",
  });
  assert.equal(result.items.length, 7);
  assert.equal(result.items[0]?.id, "0");
  assert.equal(result.seeAllLink?.label, "See all in Acme");
  assert.equal(result.seeAllLink?.to.params?.spaceId, scopeId);
});

test("truncateInSpaceNavItems pins an active item beyond the limit", () => {
  const items = Array.from({ length: 10 }, (_, index) => link(String(index), `Item ${index}`));
  const result = truncateInSpaceNavItems(items, {
    scopeSpaceId: scopeId,
    scopeSpaceTitle: "Acme",
    activeArtifactId: "8" as ArtifactId,
  });
  assert.equal(result.items.length, 7);
  assert.equal(result.items.at(-1)?.id, "8");
});

test("truncateInSpaceNavItems marks see-all active on space gallery route", () => {
  const items = Array.from({ length: 10 }, (_, index) => link(String(index), `Item ${index}`));
  const result = truncateInSpaceNavItems(items, {
    scopeSpaceId: scopeId,
    scopeSpaceTitle: "Acme",
    activeSpaceId: scopeId,
  });
  assert.equal(result.seeAllLink?.isActive, true);
});
