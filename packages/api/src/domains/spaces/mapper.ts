import type { SpaceSummary } from "@denser/contracts";
import type { space } from "../../db/schema/space.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export function toSpaceSummary(row: typeof space.$inferSelect): SpaceSummary {
  return {
    id: row.id,
    title: row.title,
    parentSpaceId: row.parentSpaceId,
    rootSpaceId: row.rootSpaceId,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
