import type { ReactionAggregateDto, UserId } from "@denser/contracts";
import type { ReactionRow } from "./types.js";

export function aggregateReactions(rows: readonly ReactionRow[], viewerId: UserId): ReactionAggregateDto[] {
  const grouped = new Map<string, { count: number; reactedByMe: boolean; firstReactedAt: Date }>();
  for (const row of rows) {
    const existing = grouped.get(row.emoji);
    if (existing) {
      existing.count += 1;
      if (row.userId === viewerId) existing.reactedByMe = true;
      if (row.reactedAt < existing.firstReactedAt) existing.firstReactedAt = row.reactedAt;
      continue;
    }
    grouped.set(row.emoji, { count: 1, reactedByMe: row.userId === viewerId, firstReactedAt: row.reactedAt });
  }
  return [...grouped.entries()]
    .sort((a, b) => a[1].firstReactedAt.getTime() - b[1].firstReactedAt.getTime())
    .map(([emoji, aggregate]) => ({ emoji, count: aggregate.count, reactedByMe: aggregate.reactedByMe }));
}
