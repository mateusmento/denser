<script setup lang="ts">
import type { ArtifactId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { MentionCandidate } from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import { createDocumentDraftState, useDocumentSync } from "../composables/useDocumentSync";
import { toDocumentEditorView } from "../types";
import DocumentEditorContainer from "./DocumentEditorContainer.vue";
import DocumentHeaderContainer from "./DocumentHeaderContainer.vue";
import DocumentSurface from "../presentationals/DocumentSurface.vue";

const route = useRoute();
const artifactId = computed(() => route.params.documentId as ArtifactId);

const { draft, dirty } = createDocumentDraftState();
const {
  surfaceView,
  spaceMembers,
  relationSpaces,
  exploreRelationSpace,
  getRelationDocuments,
  currentSpaceId,
  currentDocumentId,
  bindDraft,
  reload,
  addDocumentTypeProperty,
  deleteDocumentTypeProperty,
  renameDocumentTypeProperty,
  duplicateDocumentTypeProperty,
  patchDocumentTypeProperties,
} = useDocumentSync(artifactId);

bindDraft(draft, dirty);

const mentionItems = ref<MentionCandidate[]>([]);

const editorView = computed(() => ({
  ...toDocumentEditorView(surfaceView.value),
  mentionItems: mentionItems.value,
  members: spaceMembers.value,
  currentSpaceId: currentSpaceId.value,
  currentDocumentId: currentDocumentId.value,
  relationSpaces: relationSpaces.value,
  getRelationDocuments,
  onExploreRelationSpace: exploreRelationSpace,
}));

function onMentionSearch(query: string) {
  mentionItems.value = documentMentionItems(query);
}
</script>

<template>
  <DocumentSurface>
    <template #header>
      <DocumentHeaderContainer :header="surfaceView.header" />
    </template>

    <DocumentEditorContainer
      v-model="draft"
      :view="editorView"
      @retry="reload"
      @mention-search="onMentionSearch"
      @add-property="addDocumentTypeProperty"
      @delete-property="deleteDocumentTypeProperty"
      @rename-property="renameDocumentTypeProperty"
      @duplicate-property="duplicateDocumentTypeProperty"
      @edit-property="(prop) => patchDocumentTypeProperties((editorView.propertiesSchema ?? []).map((p) => p.id === prop.id ? prop : p))"
    />
  </DocumentSurface>
</template>
