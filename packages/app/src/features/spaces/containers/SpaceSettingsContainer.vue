<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { SpaceGeneralPanel } from "@/modules/spaces";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceMembersContainer from "./SpaceMembersContainer.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceSettingsSection } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  spaceId: SpaceId;
  title: string;
}>();

const spaceId = computed(() => props.spaceId);
const { content, generalView, updateGeneral } = useSpaceSync(spaceId);

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
    <SpaceGeneralPanel
      v-if="activeSection === 'general'"
      :view="generalView"
      :loading="!generalView"
      @save="updateGeneral"
    />
    <SpaceMembersContainer v-else-if="activeSection === 'members'" :space-id="spaceId" />
  </SpaceSettingsDialog>
</template>
