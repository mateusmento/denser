<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
  type WorkflowStageId,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import BoardSurface from "../presentationals/BoardSurface.vue";
import type { BoardColumn } from "../lib/planning";

const { Story } = defineMeta({
  title: "features/spaces/BoardSurface",
  component: BoardSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const now = "2026-01-01T00:00:00.000Z";

const columns: BoardColumn[] = [
  {
    stageId: "todo",
    name: "Todo",
    kind: "idle",
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
        stageId: "todo" as WorkflowStageId,
        rank: 0,
      },
    ],
  },
  { stageId: "doing", name: "In Progress", kind: "in_progress", documents: [] },
  { stageId: "review", name: "In Review", kind: "in_progress", documents: [] },
  { stageId: "done", name: "Done", kind: "settled", documents: [] },
];
</script>

<template>
  <Story as-child name="Kanban">
    <BoardSurface
      :columns="columns"
      @open="action('open')($event)"
      @drop="action('drop')($event)"
    />
  </Story>
  <Story as-child name="Empty until start">
    <BoardSurface
      :columns="columns"
      empty-until-start
      can-manage
      @start="action('start')()"
    />
  </Story>
</template>
