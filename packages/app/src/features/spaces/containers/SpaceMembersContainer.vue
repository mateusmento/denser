<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed } from "vue";
import { useSpaceMembersActions } from "../composables/useSpaceMembersActions";
import SpaceMembersPanel from "../presentationals/SpaceMembersPanel.vue";

const props = defineProps<{
  spaceId: SpaceId;
}>();

const spaceId = computed(() => props.spaceId);

const { membersView, onAddMember, onRemoveMember, onUpdateVisibility } =
  useSpaceMembersActions(spaceId);
</script>

<template>
  <SpaceMembersPanel
    v-if="membersView"
    :view="membersView"
    @add-member="onAddMember"
    @remove-member="onRemoveMember"
    @update-visibility="onUpdateVisibility"
  />
  <p v-else class="text-sm text-muted-foreground">Loading members…</p>
</template>
