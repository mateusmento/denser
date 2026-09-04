<script setup lang="ts">
import {
  SEED_USER_ALICE,
  type ArtifactSummary,
  type DocumentTypeId,
  type SpaceMember,
  type UserId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { issuePropertiesSchema } from "@/features/document/fixtures";
import IssueCard from "../presentationals/IssueCard.vue";

const { Story } = defineMeta({
  title: "features/spaces/IssueCard",
  component: IssueCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const issueTypeId = "00000000-0000-4000-8000-000000000020" as DocumentTypeId;

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
    labels: ["Frontend", "Bug"],
    estimate: 5,
    due_date: "2026-03-20",
  },
};
</script>

<template>
  <Story as-child name="Backlog">
    <div class="w-72">
      <IssueCard
        :document="document"
        :schema="issuePropertiesSchema"
        :members="members"
        variant="backlog"
      />
    </div>
  </Story>
  <Story as-child name="Board">
    <div class="w-72">
      <IssueCard
        :document="document"
        :schema="issuePropertiesSchema"
        :members="members"
        variant="board"
      />
    </div>
  </Story>
</template>
