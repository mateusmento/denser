<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
  SEED_USER_ALICE,
  type ArtifactId,
  type ArtifactSummary,
  type DocumentTypeId,
  type DocumentTypeView,
  type SpaceMember,
  type UserId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import { issuePropertiesSchema } from "@/features/document/fixtures";
import BacklogSurface from "../presentationals/BacklogSurface.vue";
import { placeInBacklog, type BacklogSection } from "../lib/planning";

const { Story } = defineMeta({
  title: "features/spaces/BacklogSurface",
  component: BacklogSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const plannedId = "00000000-0000-4000-8000-000000000022" as ArtifactId;
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
  spaceId: ArtifactSummary["spaceId"],
  overrides: Partial<ArtifactSummary> = {},
): ArtifactSummary {
  return {
    id,
    kind: "document",
    title,
    spaceId,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: SEED_USER_ALICE,
    version: 1,
    createdAt: now,
    updatedAt: now,
    rank: 0,
    documentTypeKey: "issue",
    documentTypeId: issueTypeId,
    stageName: "In progress",
    properties: {
      priority: "High",
      assignee: SEED_USER_ALICE as UserId,
      labels: ["Frontend"],
      estimate: 3,
      due_date: "2026-03-15",
    },
    ...overrides,
  };
}

const scrumSections = ref<BacklogSection[]>([
  {
    key: "upcoming",
    title: "Upcoming",
    subtitle: "Sprint 1",
    spaceId: SEED_SPACE_ENGINEERING,
    documents: [issueCard(plannedId, "Planned issue", SEED_SPACE_ENGINEERING)],
  },
  {
    key: "unscheduled",
    title: "This space",
    spaceId: SEED_SPACE_ACME,
    documents: [
      issueCard(SEED_ARTIFACT_ONBOARDING_NOTES, "Onboarding notes", SEED_SPACE_ACME),
      issueCard(SEED_ARTIFACT_PERSONAL_NOTES, "Personal notes", SEED_SPACE_ACME, {
        properties: { priority: "Medium", assignee: SEED_USER_ALICE, labels: [], estimate: 1 },
      }),
    ],
  },
]);

const kanbanSections = ref<BacklogSection[]>([
  {
    key: "unscheduled",
    title: "Backlog",
    spaceId: SEED_SPACE_ACME,
    documents: [
      issueCard(SEED_ARTIFACT_ONBOARDING_NOTES, "Onboarding notes", SEED_SPACE_ACME),
      issueCard(SEED_ARTIFACT_PERSONAL_NOTES, "Personal notes", SEED_SPACE_ACME),
    ],
  },
]);

function onScrumMove(payload: {
  artifactId: string;
  toSpaceId: string;
  afterId: string | null;
  beforeId: string | null;
}) {
  action("move")(payload);
  scrumSections.value = placeInBacklog(scrumSections.value, payload);
}

function onKanbanMove(payload: {
  artifactId: string;
  toSpaceId: string;
  afterId: string | null;
  beforeId: string | null;
}) {
  action("move")(payload);
  kanbanSections.value = placeInBacklog(kanbanSections.value, payload);
}
</script>

<template>
  <Story as-child name="Scrum">
    <BacklogSurface
      :sections="scrumSections"
      can-manage
      sprinting-enabled
      :document-types="documentTypes"
      :members="members"
      @open="action('open')($event)"
      @create="action('create')($event)"
      @move="onScrumMove"
      @start="action('start')()"
      @complete="action('complete')()"
    />
  </Story>
  <Story as-child name="Kanban">
    <BacklogSurface
      :sections="kanbanSections"
      :document-types="documentTypes"
      :members="members"
      @open="action('open')($event)"
      @create="action('create')($event)"
      @move="onKanbanMove"
    />
  </Story>
</template>
