<script setup lang="ts">
import type { ArtifactId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { MentionCandidate } from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import {
  createDocumentDraftState,
  useDocumentSync,
} from "../composables/useDocumentSync";
import DocumentSurface from "../presentationals/DocumentSurface.vue";

const route = useRoute();
const artifactId = computed(() => route.params.documentId as ArtifactId | undefined);

const { draft, dirty } = createDocumentDraftState();
const { surfaceView, bindDraft, reload } = useDocumentSync(artifactId);

bindDraft(draft, dirty);

const mentionItems = ref<MentionCandidate[]>([]);

const view = computed(() => ({
  ...surfaceView.value,
  mentionItems: mentionItems.value,
}));

function onMentionSearch(query: string) {
  mentionItems.value = documentMentionItems(query);
}

async function uploadImage(file: File) {
  return URL.createObjectURL(file);
}
</script>

<template>
  <DocumentSurface
    v-model="draft"
    :view="view"
    :upload-image="uploadImage"
    @retry="reload"
    @mention-search="onMentionSearch"
  />
</template>
