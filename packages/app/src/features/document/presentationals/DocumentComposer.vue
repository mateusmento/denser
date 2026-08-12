<script setup lang="ts">
import {
  RichTextComposer,
  RichTextPreview,
  type JSONContent,
  type MentionCandidate,
} from "@/modules/rich-text";

const body = defineModel<JSONContent>({ required: true });

defineProps<{
  placeholder?: string;
  editable?: boolean;
  mentionItems?: readonly MentionCandidate[];
  uploadImage?: (file: File) => Promise<string>;
}>();

const emit = defineEmits<{
  mentionSearch: [query: string];
}>();
</script>

<template>
  <RichTextComposer
    v-if="editable !== false"
    v-model="body"
    class="min-h-48"
    :placeholder="placeholder ?? 'Start writing…'"
    :mention-items="mentionItems"
    :upload-image="uploadImage"
    @mention-search="emit('mentionSearch', $event)"
  />
  <RichTextPreview v-else :doc="body" />
</template>
