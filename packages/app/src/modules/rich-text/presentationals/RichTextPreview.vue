<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";
import RichTextSubtree from "./RichTextSubtree.vue";

defineProps<{
  doc: JSONContent;
  taskEditable?: boolean;
}>();

const emit = defineEmits<{
  toggleTask: [node: JSONContent];
}>();
</script>

<template>
  <div class="rt-preview min-w-0" data-slot="rich-text-preview">
    <RichTextSubtree
      :node="doc"
      :task-editable="taskEditable"
      @toggle-task="emit('toggleTask', $event)"
    />
  </div>
</template>
