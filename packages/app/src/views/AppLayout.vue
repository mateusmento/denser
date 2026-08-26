<script setup lang="ts">
import { RouterView } from "vue-router";
import WorkspaceNavContainer from "@/features/shell/containers/WorkspaceNavContainer.vue";
import AppShell from "@/features/shell/presentationals/AppShell.vue";
import { ArtifactPeekHost, useArtifactPeekHost } from "@/modules/workspace";

const { peekState, closePeek } = useArtifactPeekHost();
</script>

<template>
  <AppShell>
    <template #sidebar>
      <WorkspaceNavContainer />
    </template>
    <RouterView />
    <ArtifactPeekHost v-if="peekState.open" :peek="peekState" @close="closePeek" />
  </AppShell>
</template>
