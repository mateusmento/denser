<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { useSpaceTabBarSync } from "../composables/useSpaceTabBarSync";
import { useSpaceTabHostNavigation } from "../composables/useSpaceTabHostNavigation";
import SpaceTabBar from "../presentationals/SpaceTabBar.vue";

useSpaceTabHostNavigation();
const { tabs, visible, pinChildSpaces, addTab, pinChildSpace, closeTab } = useSpaceTabBarSync();
</script>

<template>
  <SpaceTabBar
    v-if="visible"
    :tabs="tabs"
    :child-spaces="pinChildSpaces"
    @add="addTab"
    @pin-child-space="(id) => pinChildSpace(id as SpaceId)"
    @close="closeTab"
  />
</template>
