<script setup lang="ts">
import {
  SEED_USER_ALICE,
  type ArtifactSummary,
  type DocumentTypeId,
  type DocumentTypeView,
  type SpaceMember,
  type UserId,
  type WorkflowId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { issuePropertiesSchema } from "@/features/document/fixtures";
import PlanningCard from "../presentationals/PlanningCard.vue";

const { Story } = defineMeta({
  title: "features/spaces/PlanningCard",
  component: PlanningCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const issueTypeId = "00000000-0000-4000-8000-000000000020" as DocumentTypeId;
const specTypeId = "00000000-0000-4000-8000-000000000030" as DocumentTypeId;

const members: SpaceMember[] = [
  {
    userId: SEED_USER_ALICE,
    name: "Alice Chen",
    username: "alice",
    role: "owner",
    createdAt: now,
  },
];

const documentTypes: DocumentTypeView[] = [
  {
    id: issueTypeId,
    name: "Issue",
    key: "issue",
    workflowId: "00000000-0000-4000-8000-000000000040" as WorkflowId,
    properties: issuePropertiesSchema,
  },
  {
    id: specTypeId,
    name: "Spec",
    key: "spec",
    workflowId: null,
    properties: [
      {
        id: "prop-spec-assignee" as never,
        key: "assignee",
        name: "Assignee",
        type: "person",
        required: false,
        allowMultiple: false,
        order: 0,
        semanticRole: "assignee",
      },
      {
        id: "prop-spec-labels" as never,
        key: "labels",
        name: "Labels",
        type: "multi_select",
        required: false,
        options: [{ id: "spec", name: "Spec", color: "#8b5cf6" }],
        order: 1,
        semanticRole: "labels",
      },
    ],
  },
];

const issueDocument: ArtifactSummary = {
  id: "00000000-0000-4000-8000-000000000021" as ArtifactSummary["id"],
  kind: "document",
  title: "Fix login redirect on mobile",
  spaceId: null,
  rootSpaceId: null,
  createdBy: SEED_USER_ALICE,
  version: 1,
  createdAt: now,
  updatedAt: now,
  documentTypeKey: "issue",
  documentTypeId: issueTypeId,
  stageName: "In progress",
  properties: {
    priority: "High",
    assignee: SEED_USER_ALICE as UserId,
    labels: ["Frontend"],
    estimate: 5,
    due_date: "2026-03-20",
  },
};

const specDocument: ArtifactSummary = {
  id: "00000000-0000-4000-8000-000000000031" as ArtifactSummary["id"],
  kind: "document",
  title: "Auth flow specification",
  spaceId: null,
  rootSpaceId: null,
  createdBy: SEED_USER_ALICE,
  version: 1,
  createdAt: now,
  updatedAt: now,
  documentTypeKey: "spec",
  documentTypeId: specTypeId,
  stageName: "Draft",
  properties: {
    assignee: SEED_USER_ALICE as UserId,
    labels: ["Spec"],
  },
};
</script>

<template>
  <Story as-child name="Issue">
    <div class="w-72">
      <PlanningCard
        :document="issueDocument"
        :document-types="documentTypes"
        :members="members"
        variant="backlog"
      />
    </div>
  </Story>
  <Story as-child name="Spec">
    <div class="w-72">
      <PlanningCard
        :document="specDocument"
        :document-types="documentTypes"
        :members="members"
        variant="backlog"
      />
    </div>
  </Story>
</template>
