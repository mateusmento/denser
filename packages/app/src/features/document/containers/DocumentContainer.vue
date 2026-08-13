<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { MentionCandidate } from "@/modules/rich-text";
import {
  documentMentionItems,
  emptyDraft,
  readyDocumentView,
  seededDraft,
} from "../fixtures";
import DocumentSurface from "../presentationals/DocumentSurface.vue";
import type { DocumentDraftView } from "../types";

const route = useRoute();

const draft = ref<DocumentDraftView>(cloneDraft("onboarding"));

const view = reactive({
  ...readyDocumentView,
  mentionItems: [] as MentionCandidate[],
});

watch(
  () => route.params.documentId,
  (documentId) => {
    const id = typeof documentId === "string" ? documentId : "onboarding";
    draft.value = cloneDraft(id);
    view.header = headerForDocument(id);
  },
  { immediate: true },
);

function cloneDraft(id: string): DocumentDraftView {
  const source = id === "new" ? emptyDraft : seededDraft;
  return { ...source, body: structuredClone(source.body) };
}

function headerForDocument(id: string) {
  if (id === "new") {
    return { title: "Untitled", spaceLabel: readyDocumentView.header.spaceLabel };
  }
  return { ...readyDocumentView.header };
}

function onMentionSearch(query: string) {
  view.mentionItems = documentMentionItems(query);
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
    @mention-search="onMentionSearch"
  />
</template>
