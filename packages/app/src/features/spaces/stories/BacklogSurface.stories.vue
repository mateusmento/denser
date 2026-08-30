<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
  SEED_USER_ALICE,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import BacklogSurface from "../presentationals/BacklogSurface.vue";
import type { BacklogSection } from "../lib/planning";

const { Story } = defineMeta({
  title: "features/spaces/BacklogSurface",
  component: BacklogSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";

const sections: BacklogSection[] = [
  {
    key: "upcoming",
    title: "Upcoming",
    subtitle: "Sprint 1",
    spaceId: SEED_SPACE_ENGINEERING,
    documents: [],
  },
  {
    key: "unscheduled",
    title: "This space",
    spaceId: SEED_SPACE_ACME,
    documents: [
      {
        id: SEED_ARTIFACT_ONBOARDING_NOTES,
        kind: "document",
        title: "Onboarding notes",
        spaceId: SEED_SPACE_ACME,
        rootSpaceId: SEED_SPACE_ACME,
        createdBy: SEED_USER_ALICE,
        version: 1,
        createdAt: now,
        updatedAt: now,
        rank: 0,
      },
    ],
  },
];
</script>

<template>
  <Story as-child name="Scrum">
    <BacklogSurface
      :sections="sections"
      can-manage
      sprinting-enabled
      @open="action('open')($event)"
      @create="action('create')($event)"
      @move="action('move')($event)"
      @start="action('start')()"
      @complete="action('complete')()"
    />
  </Story>
  <Story as-child name="Kanban">
    <BacklogSurface
      :sections="[{ ...sections[1]!, title: 'Backlog', key: 'unscheduled' }]"
      @open="action('open')($event)"
      @create="action('create')($event)"
      @move="action('move')($event)"
    />
  </Story>
</template>
