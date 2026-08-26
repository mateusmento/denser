<script setup lang="ts">
import { ref } from "vue";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceGeneralPanel from "../presentationals/SpaceGeneralPanel.vue";
import type { SpaceGeneralView } from "../types";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceGeneralPanel",
  component: SpaceGeneralPanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const view: SpaceGeneralView = {
  title: "Acme",
  icon: "briefcase",
  canManage: true,
  isSaving: false,
};
</script>

<template>
  <Story as-child name="Default">
    <SpaceGeneralPanel :view="view" @save="action('save')($event)" />
  </Story>

  <Story as-child name="Loading">
    <SpaceGeneralPanel loading />
  </Story>
</template>
