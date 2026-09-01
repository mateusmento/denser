import type {
  DocumentTypeId,
  DocumentTypeView,
  PatchDocumentTypeInput,
  SpaceId,
  WorkflowView,
} from "@denser/contracts";
import { sanitizePropertyDefinitions } from "@denser/contracts";
import {
  findDocumentTypeById,
  listDocumentTypesForSpace,
  listWorkflowsForSpace,
  updateDocumentTypeProperties,
} from "./repository.js";

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
    properties: row.properties ?? [],
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

export async function patchDocumentType(
  id: DocumentTypeId,
  input: PatchDocumentTypeInput,
): Promise<{ ok: true; documentType: DocumentTypeView } | { ok: false; reason: "not_found" }> {
  const existing = await findDocumentTypeById(id);
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  const updated = await updateDocumentTypeProperties(id, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.properties !== undefined
      ? { properties: sanitizePropertyDefinitions(input.properties) }
      : {}),
  });

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, documentType: toDocumentTypeView(updated) };
}
