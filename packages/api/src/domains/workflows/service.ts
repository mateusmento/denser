import type { DocumentTypeView, SpaceId, WorkflowView } from "@denser/contracts";
import { listDocumentTypesForSpace, listWorkflowsForSpace } from "./repository.js";

export function toWorkflowView(
  row: Awaited<ReturnType<typeof listWorkflowsForSpace>>[number],
): WorkflowView {
  return {
    id: row.id,
    name: row.name,
    spaceId: row.spaceId,
    stages: [...row.stages]
      .sort((a, b) => a.sort - b.sort)
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        kind: stage.kind,
        sort: stage.sort,
        allowedSourceStageIds: stage.allowedSourceStageIds,
      })),
  };
}

export function toDocumentTypeView(
  row: Awaited<ReturnType<typeof listDocumentTypesForSpace>>[number],
): DocumentTypeView {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    workflowId: row.workflowId ?? null,
  };
}

export async function loadPlanningForSpace(spaceId: SpaceId): Promise<{
  workflow: WorkflowView | null;
  documentTypes: DocumentTypeView[];
}> {
  const [workflows, types] = await Promise.all([
    listWorkflowsForSpace(spaceId),
    listDocumentTypesForSpace(spaceId),
  ]);
  const issue = workflows.find((row) => row.name === "Issue tracking") ?? workflows[0];
  return {
    workflow: issue ? toWorkflowView(issue) : null,
    documentTypes: types.map(toDocumentTypeView),
  };
}
