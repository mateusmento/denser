<script setup lang="ts">
import type { HastLike } from "../lib/highlight";
import { languageClassName } from "../lib/highlight";
import RichTextHast from "./RichTextHast.vue";

defineProps<{
  nodes: readonly HastLike[];
}>();
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <span v-if="node.type === 'text'">{{ node.value }}</span>
    <span v-else-if="node.type === 'element'" :class="languageClassName(node.properties)">
      <RichTextHast v-if="node.children?.length" :nodes="node.children" />
    </span>
  </template>
</template>
