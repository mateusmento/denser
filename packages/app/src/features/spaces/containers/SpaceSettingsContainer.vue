<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { SpaceGeneralPanel } from "@/modules/spaces";
import { useSpaceMembersActions } from "../composables/useSpaceMembersActions";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceMembersPanel from "../presentationals/SpaceMembersPanel.vue";
import SpaceSettingsDialog from "../presentationals/SpaceSettingsDialog.vue";
import type { SpaceSettingsSection } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  spaceId: SpaceId;
  title: string;
}>();

const spaceId = computed(() => props.spaceId);
const {
  content,
  generalView,
  membersView,
  reload,
  updateGeneral,
  addMember,
  removeMember,
  updateVisibility,
} = useSpaceSync(spaceId);

const { onAddMember, onRemoveMember, onUpdateVisibility } = useSpaceMembersActions({
  membersView,
  content,
  reload,
  addMember,
  removeMember,
  updateVisibility,
});

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
    <SpaceMembersPanel
      v-else-if="activeSection === 'members'"
      :view="membersView"
      :loading="!membersView"
      @add-member="onAddMember"
      @remove-member="onRemoveMember"
      @update-visibility="onUpdateVisibility"
    />
  </SpaceSettingsDialog>
</template>
