<script setup lang="ts">
import type { PropertyDefinition } from "@denser/contracts";
import DocumentEditor from "../presentationals/DocumentEditor.vue";
import type { AddPropertyPayload } from "../presentationals/PropertyAddMenu.vue";
import type { DocumentDraftView, DocumentEditorView } from "../types";

const draft = defineModel<DocumentDraftView>({ required: true });

defineProps<{
  view: DocumentEditorView;
}>();

const emit = defineEmits<{
  retry: [];
  mentionSearch: [query: string];
  updateProperty: [key: string, value: unknown];
  addProperty: [property: AddPropertyPayload];
  deleteProperty: [propertyId: string];
  renameProperty: [propertyId: string, newName: string];
  duplicateProperty: [propertyId: string];
  editProperty: [property: PropertyDefinition];
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
    @update-property="(k, v) => emit('updateProperty', k, v)"
    @add-property="emit('addProperty', $event)"
    @delete-property="emit('deleteProperty', $event)"
    @rename-property="(id, name) => emit('renameProperty', id, name)"
    @duplicate-property="emit('duplicateProperty', $event)"
    @edit-property="emit('editProperty', $event)"
  />
</template>
