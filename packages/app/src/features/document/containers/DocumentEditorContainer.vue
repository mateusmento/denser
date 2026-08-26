<script setup lang="ts">
import DocumentEditor from "../presentationals/DocumentEditor.vue";
import type { DocumentDraftView, DocumentEditorView } from "../types";

const draft = defineModel<DocumentDraftView>({ required: true });

defineProps<{
  view: DocumentEditorView;
}>();

const emit = defineEmits<{
  retry: [];
  mentionSearch: [query: string];
}>();

async function uploadImage(file: File) {
  return URL.createObjectURL(file);
}
</script>

<template>
  <DocumentEditor
    v-model="draft"
    :view="view"
    :upload-image="uploadImage"
    @retry="emit('retry')"
    @mention-search="emit('mentionSearch', $event)"
  />
</template>
