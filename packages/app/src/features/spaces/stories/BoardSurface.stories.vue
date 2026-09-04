<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
  type ArtifactId,
  type ArtifactSummary,
  type DocumentTypeId,
  type DocumentTypeView,
  type SpaceMember,
  type UserId,
  type WorkflowStageId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import { issuePropertiesSchema } from "@/features/document/fixtures";
import BoardSurface from "../presentationals/BoardSurface.vue";
import { placeInBoard, type BoardColumn } from "../lib/planning";

const { Story } = defineMeta({
  title: "features/spaces/BoardSurface",
  component: BoardSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const authFlowId = "00000000-0000-4000-8000-000000000022" as ArtifactId;
const reviewDocId = "00000000-0000-4000-8000-000000000023" as ArtifactId;
const issueTypeId = "00000000-0000-4000-8000-000000000020" as DocumentTypeId;

const documentTypes: DocumentTypeView[] = [
  {
    id: issueTypeId,
    name: "Issue",
    key: "issue",
    workflowId: null,
    properties: issuePropertiesSchema,
  },
];

const members: SpaceMember[] = [
  {
    userId: SEED_USER_ALICE,
    name: "Alice Chen",
    username: "alice",
    role: "owner",
    createdAt: now,
  },
];

function issueCard(
  id: ArtifactId,
  title: string,
  stageId: WorkflowStageId,
  rank: number,
): ArtifactSummary {
  return {
    id,
    kind: "document",
    title,
    spaceId: SEED_SPACE_ACME,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: SEED_USER_ALICE,
    version: 1,
    createdAt: now,
    updatedAt: now,
    stageId,
    rank,
    documentTypeKey: "issue",
    documentTypeId: issueTypeId,
    stageName: stageId === "todo" ? "Todo" : stageId === "doing" ? "In Progress" : "In Review",
    properties: {
      priority: "High",
      assignee: SEED_USER_ALICE as UserId,
      labels: ["Frontend"],
      estimate: 3,
    },
  };
}

const initialColumns: BoardColumn[] = [
  {
    stageId: "todo",
    name: "Todo",
    kind: "idle",
    documents: [
      issueCard(SEED_ARTIFACT_ONBOARDING_NOTES, "Onboarding notes", "todo" as WorkflowStageId, 0),
      issueCard(authFlowId, "Auth flow spec", "todo" as WorkflowStageId, 1),
    ],
  },
  {
    stageId: "doing",
    name: "In Progress",
    kind: "in_progress",
    documents: [
      issueCard(SEED_ARTIFACT_PERSONAL_NOTES, "Personal notes", "doing" as WorkflowStageId, 0),
    ],
  },
  {
    stageId: "review",
    name: "In Review",
    kind: "in_progress",
    documents: [issueCard(reviewDocId, "Review checklist", "review" as WorkflowStageId, 0)],
  },
  { stageId: "done", name: "Done", kind: "settled", documents: [] },
];

const columns = ref(
  initialColumns.map((column) => ({ ...column, documents: [...column.documents] })),
);

function onDrop(payload: {
  artifactId: string;
  stageId: string;
  afterId: string | null;
  beforeId: string | null;
}) {
  action("drop")(payload);
  columns.value = placeInBoard(columns.value, payload);
}
</script>

<template>
  <Story as-child name="Kanban">
    <BoardSurface
      :columns="columns"
      :document-types="documentTypes"
      :members="members"
      @open="action('open')($event)"
      @drop="onDrop"
    />
  </Story>
  <Story as-child name="Empty until start">
    <BoardSurface
      :columns="initialColumns"
      empty-until-start
      can-manage
      :document-types="documentTypes"
      :members="members"
      @start="action('start')()"
    />
  </Story>
</template>
