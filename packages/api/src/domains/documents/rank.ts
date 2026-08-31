export const RANK_STRIDE = 1000;

export type RankRow = {
  id: string;
  rank: number;
  title: string;
  spaceId: string | null;
  stageId: string | null;
};

export function appendRank(maxRank: number | null): number {
  return maxRank == null ? RANK_STRIDE : maxRank + RANK_STRIDE;
}

export function pickNeighbor(
  id: string | null | undefined,
  movedId: string,
  rows: readonly RankRow[],
  targetSpaceId: string | null,
  targetStageId?: string | null,
): RankRow | null {
  if (id == null || id === movedId) return null;
  const row = rows.find((entry) => entry.id === id);
  if (!row) return null;
  if (row.spaceId !== targetSpaceId) return null;
  if (targetStageId !== undefined && row.stageId !== targetStageId) return null;
  return row;
}

export function resolvePlaceBounds(
  after: RankRow | null,
  before: RankRow | null,
): {
  afterRank: number | null;
  beforeRank: number | null;
  afterId: string | null;
  beforeId: string | null;
} {
  if (after && before && after.rank < before.rank) {
    return {
      afterRank: after.rank,
      beforeRank: before.rank,
      afterId: after.id,
      beforeId: before.id,
    };
  }
  if (after) {
    return { afterRank: after.rank, beforeRank: null, afterId: after.id, beforeId: null };
  }
  if (before) {
    return { afterRank: null, beforeRank: before.rank, afterId: null, beforeId: before.id };
  }
  return { afterRank: null, beforeRank: null, afterId: null, beforeId: null };
}

export function computeRank(
  afterRank: number | null,
  beforeRank: number | null,
  maxRank: number | null,
): { kind: "value"; rank: number } | { kind: "reindex" } {
  if (afterRank == null && beforeRank == null) {
    return { kind: "value", rank: appendRank(maxRank) };
  }
  if (afterRank == null && beforeRank != null) {
    return { kind: "value", rank: beforeRank - RANK_STRIDE };
  }
  if (afterRank != null && beforeRank == null) {
    return { kind: "value", rank: afterRank + RANK_STRIDE };
  }
  if (beforeRank! - afterRank! < 2) return { kind: "reindex" };
  return { kind: "value", rank: afterRank! + Math.floor((beforeRank! - afterRank!) / 2) };
}

export function orderIdsForReindex(
  others: readonly RankRow[],
  movedId: string,
  afterId: string | null,
  beforeId: string | null,
): string[] {
  const sorted = others
    .slice()
    .sort((left, right) => left.rank - right.rank || left.title.localeCompare(right.title));
  let at = sorted.length;
  if (afterId) {
    const index = sorted.findIndex((row) => row.id === afterId);
    if (index >= 0) at = index + 1;
  } else if (beforeId) {
    const index = sorted.findIndex((row) => row.id === beforeId);
    if (index >= 0) at = index;
  }
  return [
    ...sorted.slice(0, at).map((row) => row.id),
    movedId,
    ...sorted.slice(at).map((row) => row.id),
  ];
}

export function strideRank(index: number): number {
  return (index + 1) * RANK_STRIDE;
}
