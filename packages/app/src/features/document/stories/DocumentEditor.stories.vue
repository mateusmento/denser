<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { reactive, ref } from "vue";
import type { MentionCandidate } from "@/modules/rich-text";
import {
  documentMentionItems,
  emptyDraft,
  errorDocumentView,
  forbiddenDocumentView,
  loadingDocumentView,
  readOnlyDocumentView,
  readyDocumentView,
  seededDraft,
} from "../fixtures";
import DocumentEditor from "../presentationals/DocumentEditor.vue";
import { toDocumentEditorView, type DocumentDraftView } from "../types";

const { Story } = defineMeta({
  title: "features/document/DocumentEditor",
  component: DocumentEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Document title + body region (loading, error, forbidden, and edit-ready states). Composed inside DocumentSurface by containers.",
      },
    },
  },
});

function storyDocs(story: string) {
  return { docs: { description: { story } } };
}

const readyDraft = ref<DocumentDraftView>({
  ...seededDraft,
  body: structuredClone(seededDraft.body),
});
const blankDraft = ref<DocumentDraftView>({
  ...emptyDraft,
  body: structuredClone(emptyDraft.body),
});
const readOnlyDraft = ref<DocumentDraftView>({
  ...seededDraft,
  body: structuredClone(seededDraft.body),
});

const view = reactive({
  ...toDocumentEditorView(readyDocumentView),
  mentionItems: [] as MentionCandidate[],
});

async function onMentionSearch(query: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  view.mentionItems = documentMentionItems(query);
}
</script>

<template>
  <Story
    as-child
    name="Ready"
    :parameters="storyDocs('Edit-ready title and body (feature-tour fixture).')"
  >
    <DocumentEditor v-model="readyDraft" :view="view" @mention-search="onMentionSearch" />
  </Story>
  <Story
    as-child
    name="EmptyNew"
    :parameters="storyDocs('New document: empty title and body, ready to type.')"
  >
    <DocumentEditor v-model="blankDraft" :view="view" @mention-search="onMentionSearch" />
  </Story>
  <Story
    as-child
    name="ReadOnly"
    :parameters="storyDocs('Same layout; title and body are not editable.')"
  >
    <DocumentEditor v-model="readOnlyDraft" :view="toDocumentEditorView(readOnlyDocumentView)" />
  </Story>
  <Story as-child name="Loading" :parameters="storyDocs('Quiet skeleton; no empty-title flash.')">
    <DocumentEditor v-model="readyDraft" :view="toDocumentEditorView(loadingDocumentView)" />
  </Story>
  <Story
    as-child
    name="Error"
    :parameters="storyDocs('Inline load error and Retry; draft is not wiped.')"
  >
    <DocumentEditor v-model="readyDraft" :view="toDocumentEditorView(errorDocumentView)" />
  </Story>
  <Story
    as-child
    name="Forbidden"
    :parameters="storyDocs('No body payload; permission empty state.')"
  >
    <DocumentEditor v-model="readyDraft" :view="toDocumentEditorView(forbiddenDocumentView)" />
  </Story>
</template>
