<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { computed, ref } from "vue";
import SpaceTabBar, { type SpaceTabItem } from "../presentationals/SpaceTabBar.vue";

const { Story } = defineMeta({
  title: "features/shell/SpaceTabBar",
  component: SpaceTabBar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const pinned: SpaceTabItem[] = [
  {
    tabKey: `this-space:${SEED_SPACE_ACME}`,
    label: "This Space",
    to: { name: "space", params: { spaceId: SEED_SPACE_ACME } },
    isActive: false,
    closable: false,
  },
  {
    tabKey: `view:backlog:${SEED_SPACE_ACME}`,
    label: "Backlog",
    to: { name: "space", params: { spaceId: SEED_SPACE_ACME }, query: { view: "backlog" } },
    isActive: false,
    closable: false,
  },
];

const working = ref<SpaceTabItem[]>([
  {
    tabKey: `artifact:${SEED_ARTIFACT_ONBOARDING_NOTES}`,
    label: "Onboarding notes",
    to: { name: "document", params: { documentId: SEED_ARTIFACT_ONBOARDING_NOTES } },
    isActive: true,
    closable: true,
  },
  {
    tabKey: `artifact:${SEED_ARTIFACT_PERSONAL_NOTES}`,
    label: "Personal notes",
    to: { name: "document", params: { documentId: SEED_ARTIFACT_PERSONAL_NOTES } },
    isActive: false,
    closable: true,
  },
  {
    tabKey: `space:${SEED_SPACE_ENGINEERING}`,
    label: "Engineering",
    to: { name: "space", params: { spaceId: SEED_SPACE_ENGINEERING } },
    isActive: false,
    closable: true,
  },
]);

const tabs = computed(() => [...pinned, ...working.value]);

function onReorder(payload: { tabKey: string; toIndex: number }) {
  action("reorder")(payload);
  const fromIndex = working.value.findIndex((tab) => tab.tabKey === payload.tabKey);
  if (fromIndex < 0) return;
  const next = [...working.value];
  const [tab] = next.splice(fromIndex, 1);
  if (!tab) return;
  next.splice(payload.toIndex, 0, tab);
  working.value = next;
}
</script>

<template>
  <Story as-child name="Working tabs">
    <SpaceTabBar
      :tabs="tabs"
      :child-spaces="[{ id: SEED_SPACE_ENGINEERING, title: 'Engineering' }]"
      @add="action('add')($event)"
      @open-child-space="action('openChildSpace')($event)"
      @close="action('close')($event)"
      @reorder="onReorder"
    />
  </Story>
  <Story as-child name="Pinned only">
    <SpaceTabBar
      :tabs="pinned"
      @add="action('add')($event)"
    />
  </Story>
</template>
