import type { DocumentView, TipTapDoc } from "@denser/contracts";
import type { artifact } from "../../db/schema/artifact.js";
import type { document } from "../../db/schema/document.js";
import type { documentType, workflowStage } from "../../db/schema/workflow.js";
import { toArtifactSummary } from "../artifacts/mapper.js";

export function toDocumentView(
  artifactRow: typeof artifact.$inferSelect,
  documentRow: typeof document.$inferSelect,
  extras?: {
    stage?: typeof workflowStage.$inferSelect | null;
    documentType?: typeof documentType.$inferSelect | null;
  },
): DocumentView {
  const typeRow = extras?.documentType;
  const stageRow = extras?.stage;
  return {
    ...toArtifactSummary(artifactRow, {
      rank: documentRow.rank,
      stageId: documentRow.stageId,
      stageName: stageRow?.name ?? null,
      stageKind: stageRow?.kind ?? null,
      documentTypeId: documentRow.documentTypeId,
      documentTypeKey: typeRow?.key ?? null,
    }),
    body: documentRow.body as TipTapDoc,
  };
}
