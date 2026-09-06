<script setup lang="ts">
import type { ArtifactId } from "@denser/contracts";
import ConversationContainer from "@/features/conversation/containers/ConversationContainer.vue";

defineProps<{
  conversationId: ArtifactId;
}>();
</script>

<template>
  <ConversationContainer />
</template>
