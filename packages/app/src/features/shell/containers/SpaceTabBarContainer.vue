<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { useSpaceTabBarSync } from "../composables/useSpaceTabBarSync";
import { useSpaceTabHostNavigation } from "../composables/useSpaceTabHostNavigation";
import SpaceTabBar from "../presentationals/SpaceTabBar.vue";

useSpaceTabHostNavigation();
const { tabs, visible, childSpaces, addTab, openChildSpace, closeTab } = useSpaceTabBarSync();
</script>

<template>
  <SpaceTabBar
    v-if="visible"
    :tabs="tabs"
    :child-spaces="childSpaces"
    @add="addTab"
    @open-child-space="(id) => openChildSpace(id as SpaceId)"
    @close="closeTab"
  />
</template>
