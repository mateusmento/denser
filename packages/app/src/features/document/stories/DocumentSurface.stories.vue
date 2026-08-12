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
import DocumentSurface from "../presentationals/DocumentSurface.vue";
import type { DocumentDraftView } from "../types";

const { Story } = defineMeta({
  title: "features/document/DocumentSurface",
  component: DocumentSurface,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    fullHeight: true,
    docs: {
      description: {
        component:
          "Document canvas (header + title + body). Canvas fills the preview iframe; Docs caps each story at 40rem so the six states don’t stack a full viewport each.",
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
  ...readyDocumentView,
  mentionItems: [] as MentionCandidate[],
});

async function onMentionSearch(query: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  view.mentionItems = documentMentionItems(query);
}
</script>

<template>
  <Story as-child name="Ready" :parameters="storyDocs('Edit-ready title and body (feature-tour fixture).')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="readyDraft" :view="view" @mention-search="onMentionSearch" />
    </div>
  </Story>
  <Story as-child name="EmptyNew" :parameters="storyDocs('New document: empty title and body, ready to type.')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="blankDraft" :view="view" @mention-search="onMentionSearch" />
    </div>
  </Story>
  <Story as-child name="ReadOnly" :parameters="storyDocs('Same layout; title and body are not editable.')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="readOnlyDraft" :view="readOnlyDocumentView" />
    </div>
  </Story>
  <Story as-child name="Loading" :parameters="storyDocs('Quiet skeleton; no empty-title flash.')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="readyDraft" :view="loadingDocumentView" />
    </div>
  </Story>
  <Story as-child name="Error" :parameters="storyDocs('Inline load error and Retry; draft is not wiped.')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="readyDraft" :view="errorDocumentView" />
    </div>
  </Story>
  <Story as-child name="Forbidden" :parameters="storyDocs('No body payload; permission empty state.')">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface v-model="readyDraft" :view="forbiddenDocumentView" />
    </div>
  </Story>
</template>
