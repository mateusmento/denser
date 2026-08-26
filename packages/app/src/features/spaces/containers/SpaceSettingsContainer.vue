<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceGeneralContainer from "./SpaceGeneralContainer.vue";
import SpaceMembersContainer from "./SpaceMembersContainer.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceSettingsSection } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  spaceId: SpaceId;
  title: string;
}>();

const spaceId = computed(() => props.spaceId);
const { content } = useSpaceSync(spaceId);

const activeSection = ref<SpaceSettingsSection>("general");

const dialogTitle = computed(() => content.value?.space.title ?? props.title);
</script>

<template>
  <SpaceSettingsDialog
    v-model:open="open"
    :title="dialogTitle"
    :active-section="activeSection"
    @update:active-section="activeSection = $event"
  >
    <SpaceGeneralContainer v-if="activeSection === 'general'" :space-id="spaceId" />
    <SpaceMembersContainer v-else-if="activeSection === 'members'" :space-id="spaceId" />
  </SpaceSettingsDialog>
</template>
