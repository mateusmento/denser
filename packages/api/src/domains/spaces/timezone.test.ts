import assert from "node:assert/strict";
import { test } from "node:test";
import type { SpaceId } from "@denser/contracts";
import { resolveScheduleTimezoneFromRows } from "./timezone.js";
import type { SpaceRow } from "./repository.js";

function row(partial: Partial<SpaceRow> & Pick<SpaceRow, "id" | "visibility" | "parentSpaceId" | "timezone">): SpaceRow {
  return partial as SpaceRow;
}

test("resolveScheduleTimezone walks public folders to private ancestor", () => {
  const rows = new Map<SpaceId, SpaceRow>([
    [
      "root" as SpaceId,
      row({
        id: "root" as SpaceId,
        visibility: "private",
        parentSpaceId: null,
        timezone: "America/Sao_Paulo",
      }),
    ],
    [
      "public-folder" as SpaceId,
      row({
        id: "public-folder" as SpaceId,
        visibility: "public",
        parentSpaceId: "root" as SpaceId,
        timezone: null,
      }),
    ],
  ]);

  const resolved = resolveScheduleTimezoneFromRows("public-folder" as SpaceId, (id) => rows.get(id));
  assert.equal(resolved.timezone, "America/Sao_Paulo");
  assert.equal(resolved.privateSpaceId, "root");
});

test("resolveScheduleTimezone uses nested private space timezone", () => {
  const rows = new Map<SpaceId, SpaceRow>([
    [
      "root" as SpaceId,
      row({
        id: "root" as SpaceId,
        visibility: "private",
        parentSpaceId: null,
        timezone: "America/Sao_Paulo",
      }),
    ],
    [
      "team" as SpaceId,
      row({
        id: "team" as SpaceId,
        visibility: "private",
        parentSpaceId: "root" as SpaceId,
        timezone: "America/New_York",
      }),
    ],
  ]);

  const resolved = resolveScheduleTimezoneFromRows("team" as SpaceId, (id) => rows.get(id));
  assert.equal(resolved.timezone, "America/New_York");
  assert.equal(resolved.privateSpaceId, "team");
});
