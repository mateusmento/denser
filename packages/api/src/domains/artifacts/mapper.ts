import type {
  ArtifactSummary,
  DocumentTypeId,
  DocumentTypeKey,
  StageKind,
  WorkflowStageId,
} from "@denser/contracts";
import type { artifact } from "../../db/schema/artifact.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export type ArtifactPlanningFields = {
  rank?: number;
  stageId?: WorkflowStageId | null;
  stageName?: string | null;
  stageKind?: StageKind | null;
  documentTypeId?: DocumentTypeId | null;
  documentTypeKey?: DocumentTypeKey | null;
};

export function toArtifactSummary(
  row: typeof artifact.$inferSelect,
  planning?: ArtifactPlanningFields,
): ArtifactSummary {
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
    ...(planning?.rank !== undefined ? { rank: planning.rank } : {}),
    ...(planning?.stageId !== undefined ? { stageId: planning.stageId } : {}),
    ...(planning?.stageName !== undefined ? { stageName: planning.stageName } : {}),
    ...(planning?.stageKind !== undefined ? { stageKind: planning.stageKind } : {}),
    ...(planning?.documentTypeId !== undefined ? { documentTypeId: planning.documentTypeId } : {}),
    ...(planning?.documentTypeKey !== undefined ? { documentTypeKey: planning.documentTypeKey } : {}),
  };
}
