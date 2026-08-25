import type { ArtifactSummary } from "@denser/contracts";
import type { artifact } from "../../db/schema/artifact.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export function toArtifactSummary(row: typeof artifact.$inferSelect): ArtifactSummary {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    spaceId: row.spaceId,
    rootSpaceId: row.rootSpaceId,
    createdBy: row.createdBy,
    version: row.version,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
