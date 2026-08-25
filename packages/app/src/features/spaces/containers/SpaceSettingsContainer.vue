<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { ref } from "vue";
import SpaceMembersContainer from "./SpaceMembersContainer.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceSettingsSection } from "../types";

const open = defineModel<boolean>("open", { required: true });

defineProps<{
  spaceId: SpaceId;
  title: string;
}>();

const activeSection = ref<SpaceSettingsSection>("members");
</script>

<template>
  <SpaceSettingsDialog
    v-model:open="open"
    :title="title"
    :active-section="activeSection"
    @update:active-section="activeSection = $event"
  >
    <SpaceMembersContainer v-if="activeSection === 'members'" :space-id="spaceId" />
  </SpaceSettingsDialog>
</template>
