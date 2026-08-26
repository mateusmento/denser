<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed } from "vue";
import { useSpaceGeneralActions } from "../composables/useSpaceGeneralActions";
import SpaceGeneralPanel from "../presentationals/SpaceGeneralPanel.vue";

const props = defineProps<{
  spaceId: SpaceId;
}>();

const spaceId = computed(() => props.spaceId);

const { generalView, onSave } = useSpaceGeneralActions(spaceId);
</script>

<template>
  <SpaceGeneralPanel v-if="generalView" :view="generalView" @save="onSave" />
  <p v-else class="text-sm text-muted-foreground">Loading settings…</p>
</template>
