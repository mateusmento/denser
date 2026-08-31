<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
  SEED_USER_ALICE,
  type ArtifactId,
  type ArtifactSummary,
} from "@denser/contracts";
import { applySortCommit } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import BacklogSurface from "../presentationals/BacklogSurface.vue";
import type { BacklogSection } from "../lib/planning";

const { Story } = defineMeta({
  title: "features/spaces/BacklogSurface",
  component: BacklogSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";
const plannedId = "00000000-0000-4000-8000-000000000022" as ArtifactId;

function card(id: ArtifactId, title: string, spaceId: ArtifactSummary["spaceId"]): ArtifactSummary {
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
  };
}

const scrumSections = ref<BacklogSection[]>([
  {
    key: "upcoming",
    title: "Upcoming",
    subtitle: "Sprint 1",
    spaceId: SEED_SPACE_ENGINEERING,
    documents: [card(plannedId, "Planned issue", SEED_SPACE_ENGINEERING)],
  },
  {
    key: "unscheduled",
    title: "This space",
    spaceId: SEED_SPACE_ACME,
    documents: [
      card(SEED_ARTIFACT_ONBOARDING_NOTES, "Onboarding notes", SEED_SPACE_ACME),
      card(SEED_ARTIFACT_PERSONAL_NOTES, "Personal notes", SEED_SPACE_ACME),
    ],
  },
]);

const kanbanSections = ref<BacklogSection[]>([
  {
    key: "unscheduled",
    title: "Backlog",
    spaceId: SEED_SPACE_ACME,
    documents: [
      card(SEED_ARTIFACT_ONBOARDING_NOTES, "Onboarding notes", SEED_SPACE_ACME),
      card(SEED_ARTIFACT_PERSONAL_NOTES, "Personal notes", SEED_SPACE_ACME),
    ],
  },
]);

function applyMove(sections: BacklogSection[], payload: { artifactId: string; toSpaceId: string; toIndex: number }) {
  const from = sections.find((section) =>
    section.documents.some((document) => document.id === payload.artifactId),
  );
  if (!from) return sections;
  const lists = Object.fromEntries(sections.map((section) => [section.spaceId, [...section.documents]]));
  const next = applySortCommit(lists, payload.artifactId, from.spaceId, {
    listId: payload.toSpaceId,
    index: payload.toIndex,
  });
  return sections.map((section) => ({
    ...section,
    documents: next[section.spaceId] ?? [],
  }));
}

function onScrumMove(payload: { artifactId: string; toSpaceId: string; toIndex: number }) {
  action("move")(payload);
  scrumSections.value = applyMove(scrumSections.value, payload);
}

function onKanbanMove(payload: { artifactId: string; toSpaceId: string; toIndex: number }) {
  action("move")(payload);
  kanbanSections.value = applyMove(kanbanSections.value, payload);
}
</script>

<template>
  <Story as-child name="Scrum">
    <BacklogSurface
      :sections="scrumSections"
      can-manage
      sprinting-enabled
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
      @open="action('open')($event)"
      @create="action('create')($event)"
      @move="onKanbanMove"
    />
  </Story>
</template>
