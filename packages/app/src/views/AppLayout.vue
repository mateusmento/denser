<script setup lang="ts">
import { RouterView } from "vue-router";
import WorkspaceNavContainer from "@/features/shell/containers/WorkspaceNavContainer.vue";
import AppShell from "@/features/shell/presentationals/AppShell.vue";
</script>

<template>
  <AppShell>
    <template #sidebar>
      <WorkspaceNavContainer />
    </template>
    <RouterView />
  </AppShell>
</template>
