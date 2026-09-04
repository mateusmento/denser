<script setup lang="ts">
import {
  SEED_USER_ALICE,
  type ArtifactSummary,
  type DocumentTypeId,
  type PropertyDefinition,
  type SpaceMember,
  type UserId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import DocumentCard from "../presentationals/DocumentCard.vue";

const { Story } = defineMeta({
  title: "features/spaces/DocumentCard",
  component: DocumentCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const specTypeId = "00000000-0000-4000-8000-000000000030" as DocumentTypeId;

const schema: PropertyDefinition[] = [
  {
    id: "prop-spec-assignee" as PropertyDefinition["id"],
    key: "assignee",
    name: "Assignee",
    type: "person",
    required: false,
    allowMultiple: false,
    order: 0,
    semanticRole: "assignee",
  },
  {
    id: "prop-spec-labels" as PropertyDefinition["id"],
    key: "labels",
    name: "Labels",
    type: "multi_select",
    required: false,
    options: [{ id: "spec", name: "Spec", color: "#8b5cf6" }],
    order: 1,
    semanticRole: "labels",
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

const document: ArtifactSummary = {
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
  <Story as-child name="Backlog">
    <div class="w-72">
      <DocumentCard
        :document="document"
        :schema="schema"
        :members="members"
        variant="backlog"
      />
    </div>
  </Story>
</template>
