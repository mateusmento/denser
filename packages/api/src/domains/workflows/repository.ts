import type {
  DocumentTypeId,
  DocumentTypeKey,
  PropertyDefinition,
  PropertyDefinitionId,
  SpaceId,
  WorkflowId,
  WorkflowStageId,
} from "@denser/contracts";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { documentType, workflow, workflowStage } from "../../db/schema/workflow.js";

export const DEFAULT_ISSUE_PROPERTIES: PropertyDefinition[] = [
  {
    id: "00000000-0000-4000-8000-000000000081" as PropertyDefinitionId,
    key: "priority",
    name: "Priority",
    type: "select",
    required: false,
    options: [
      { id: "urgent", name: "Urgent", color: "#ef4444" },
      { id: "high", name: "High", color: "#f97316" },
      { id: "medium", name: "Medium", color: "#eab308" },
      { id: "low", name: "Low", color: "#3b82f6" },
    ],
    order: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000082" as PropertyDefinitionId,
    key: "assignee",
    name: "Assignee",
    type: "person",
    required: false,
    order: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000083" as PropertyDefinitionId,
    key: "labels",
    name: "Labels",
    type: "multi_select",
    required: false,
    options: [
      { id: "frontend", name: "Frontend", color: "#8b5cf6" },
      { id: "backend", name: "Backend", color: "#06b6d4" },
      { id: "design", name: "Design", color: "#ec4899" },
      { id: "bug", name: "Bug", color: "#ef4444" },
    ],
    order: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000084" as PropertyDefinitionId,
    key: "estimate",
    name: "Estimate",
    type: "number",
    required: false,
    order: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000085" as PropertyDefinitionId,
    key: "due_date",
    name: "Due date",
    type: "date",
    required: false,
    order: 4,
  },
];

export const DEFAULT_SPEC_PROPERTIES: PropertyDefinition[] = [
  {
    id: "00000000-0000-4000-8000-000000000086" as PropertyDefinitionId,
    key: "assignee",
    name: "Assignee",
    type: "person",
    required: false,
    order: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000087" as PropertyDefinitionId,
    key: "labels",
    name: "Labels",
    type: "multi_select",
    required: false,
    order: 1,
  },
];

export const DEFAULT_DOC_PROPERTIES: PropertyDefinition[] = [
  {
    id: "00000000-0000-4000-8000-000000000088" as PropertyDefinitionId,
    key: "labels",
    name: "Labels",
    type: "multi_select",
    required: false,
    order: 0,
  },
];

export async function listWorkflowsForSpace(spaceId: SpaceId) {
  return db.query.workflow.findMany({
    where: eq(workflow.spaceId, spaceId),
    with: { stages: { orderBy: [asc(workflowStage.sort)] } },
  });
}

export async function listDocumentTypesForSpace(spaceId: SpaceId) {
  return db.select().from(documentType).where(eq(documentType.spaceId, spaceId));
}

export async function findDocumentTypeByKey(spaceId: SpaceId, key: DocumentTypeKey) {
  return db.query.documentType.findFirst({
    where: and(eq(documentType.spaceId, spaceId), eq(documentType.key, key)),
  });
}

export async function findDocumentTypeById(id: DocumentTypeId) {
  return db.query.documentType.findFirst({ where: eq(documentType.id, id) });
}

export async function updateDocumentTypeProperties(
  id: DocumentTypeId,
  input: { name?: string; properties?: PropertyDefinition[] },
) {
  const [updated] = await db
    .update(documentType)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.properties !== undefined ? { properties: input.properties } : {}),
    })
    .where(eq(documentType.id, id))
    .returning();
  return updated ?? null;
}

export async function findStageById(id: WorkflowStageId) {
  return db.query.workflowStage.findFirst({ where: eq(workflowStage.id, id) });
}

export async function firstIdleStage(workflowId: WorkflowId) {
  const idle = await db.query.workflowStage.findFirst({
    where: and(eq(workflowStage.workflowId, workflowId), eq(workflowStage.kind, "idle")),
    orderBy: [asc(workflowStage.sort)],
  });
  if (idle) return idle;
  return db.query.workflowStage.findFirst({
    where: eq(workflowStage.workflowId, workflowId),
    orderBy: [asc(workflowStage.sort)],
  });
}

async function insertStages(
  workflowId: WorkflowId,
  stages: readonly {
    name: string;
    kind: "idle" | "in_progress" | "blocked" | "settled" | "cancelled";
    sort: number;
  }[],
) {
  const created = [];
  for (const stage of stages) {
    const [row] = await db
      .insert(workflowStage)
      .values({ workflowId, name: stage.name, kind: stage.kind, sort: stage.sort })
      .returning();
    if (!row) throw new Error("Failed to create workflow stage");
    created.push(row);
  }
  return created;
}

export async function provisionProjectPlanning(spaceId: SpaceId): Promise<void> {
  const existing = await db.query.workflow.findFirst({ where: eq(workflow.spaceId, spaceId) });
  if (existing) return;

  const [issueWorkflow] = await db
    .insert(workflow)
    .values({ spaceId, name: "Issue tracking" })
    .returning();
  const [specWorkflow] = await db.insert(workflow).values({ spaceId, name: "Spec" }).returning();
  if (!issueWorkflow || !specWorkflow) throw new Error("Failed to create workflows");

  const issueStages = await insertStages(issueWorkflow.id, [
    { name: "Todo", kind: "idle", sort: 0 },
    { name: "In Progress", kind: "in_progress", sort: 1 },
    { name: "In Review", kind: "in_progress", sort: 2 },
    { name: "Done", kind: "settled", sort: 3 },
  ]);
  const specStages = await insertStages(specWorkflow.id, [
    { name: "Draft", kind: "idle", sort: 0 },
    { name: "In Review", kind: "in_progress", sort: 1 },
    { name: "Approved", kind: "in_progress", sort: 2 },
    { name: "Final", kind: "settled", sort: 3 },
  ]);

  const issueDone = issueStages[3];
  const issueInReview = issueStages[2];
  const specFinal = specStages[3];
  const specApproved = specStages[2];
  if (!issueDone || !issueInReview || !specFinal || !specApproved) {
    throw new Error("Failed to create workflow stages");
  }

  await db
    .update(workflowStage)
    .set({ allowedSourceStageIds: [issueInReview.id] })
    .where(eq(workflowStage.id, issueDone.id));
  await db
    .update(workflowStage)
    .set({ allowedSourceStageIds: [specApproved.id] })
    .where(eq(workflowStage.id, specFinal.id));

  await db.insert(documentType).values([
    {
      spaceId,
      name: "Issue",
      key: "issue",
      builtin: true,
      workflowId: issueWorkflow.id,
      properties: DEFAULT_ISSUE_PROPERTIES,
    },
    {
      spaceId,
      name: "Spec",
      key: "spec",
      builtin: true,
      workflowId: specWorkflow.id,
      properties: DEFAULT_SPEC_PROPERTIES,
    },
    {
      spaceId,
      name: "Doc",
      key: "doc",
      builtin: true,
      workflowId: null,
      properties: DEFAULT_DOC_PROPERTIES,
    },
  ]);
}
