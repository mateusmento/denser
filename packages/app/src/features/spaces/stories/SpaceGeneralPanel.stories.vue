<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceGeneralPanel from "../presentationals/SpaceGeneralPanel.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceGeneralView, SpaceSettingsSection } from "../types";

const { Story } = defineMeta({
  title: "features/spaces/SpaceGeneralPanel",
  component: SpaceGeneralPanel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

const open = ref(true);
const activeSection = ref<SpaceSettingsSection>("general");

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

  <Story as-child name="InDialog">
    <Button @click="open = true">Open settings</Button>
    <SpaceSettingsDialog
      v-model:open="open"
      title="Acme"
      :active-section="activeSection"
      @update:active-section="activeSection = $event"
    >
      <SpaceGeneralPanel :view="view" @save="action('save')($event)" />
    </SpaceSettingsDialog>
  </Story>
</template>
