import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RANK_STRIDE,
  appendRank,
  computeRank,
  orderIdsForReindex,
  pickNeighbor,
  resolvePlaceBounds,
  strideRank,
  type RankRow,
} from "./rank.js";

function row(id: string, rank: number, extras: Partial<RankRow> = {}): RankRow {
  return { id, rank, title: id, spaceId: "space", stageId: "todo", ...extras };
}

const rows = [row("a", 1000), row("b", 2000, { stageId: "doing" }), row("c", 3000)];

test("append uses stride", () => {
  assert.equal(appendRank(null), RANK_STRIDE);
  assert.equal(appendRank(3000), 4000);
});

test("pickNeighbor drops self, missing, and wrong list", () => {
  assert.equal(pickNeighbor("a", "a", rows, "space", "todo"), null);
  assert.equal(pickNeighbor("missing", "x", rows, "space"), null);
  assert.equal(pickNeighbor("b", "x", rows, "space", "todo"), null);
  assert.equal(pickNeighbor("a", "x", rows, "space", "todo")?.id, "a");
});

test("inverted neighbors fall back to after", () => {
  const bounds = resolvePlaceBounds(row("c", 3000), row("a", 1000));
  assert.deepEqual(bounds, { afterRank: 3000, beforeRank: null, afterId: "c", beforeId: null });
});

test("midpoint when there is a gap", () => {
  assert.deepEqual(computeRank(1000, 3000, 3000), { kind: "value", rank: 2000 });
});

test("reindex when neighbors are packed", () => {
  assert.deepEqual(computeRank(0, 1, 2), { kind: "reindex" });
  assert.deepEqual(computeRank(5, 5, 5), { kind: "reindex" });
});

test("ends use stride offsets", () => {
  assert.deepEqual(computeRank(null, 1000, 3000), { kind: "value", rank: 0 });
  assert.deepEqual(computeRank(3000, null, 3000), { kind: "value", rank: 4000 });
});

test("reindex order inserts after the surviving neighbor", () => {
  assert.deepEqual(
    orderIdsForReindex(
      rows.filter((entry) => entry.id !== "c"),
      "c",
      null,
      "a",
    ),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    orderIdsForReindex(
      rows.filter((entry) => entry.id !== "a"),
      "a",
      "c",
      null,
    ),
    ["b", "c", "a"],
  );
  assert.equal(strideRank(0), 1000);
  assert.equal(strideRank(2), 3000);
});
