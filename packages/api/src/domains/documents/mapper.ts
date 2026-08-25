import type { DocumentView, TipTapDoc } from "@denser/contracts";
import type { artifact } from "../../db/schema/artifact.js";
import type { document } from "../../db/schema/document.js";
import { toArtifactSummary } from "../artifacts/mapper.js";

export function toDocumentView(
  artifactRow: typeof artifact.$inferSelect,
  documentRow: typeof document.$inferSelect,
): DocumentView {
  return {
    ...toArtifactSummary(artifactRow),
    body: documentRow.body as TipTapDoc,
  };
}
