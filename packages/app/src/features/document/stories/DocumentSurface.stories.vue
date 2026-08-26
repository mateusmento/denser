<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDraft, readyDocumentView, seededDraft } from "../fixtures";
import DocumentEditor from "../presentationals/DocumentEditor.vue";
import DocumentHeader from "../presentationals/DocumentHeader.vue";
import DocumentSurface from "../presentationals/DocumentSurface.vue";
import { toDocumentEditorView, type DocumentDraftView } from "../types";

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
          "Document layout shell (optional header slot + scrollable body). Containers fill slots with DocumentHeaderContainer and DocumentEditor.",
      },
    },
  },
});

const draft = ref<DocumentDraftView>({
  ...seededDraft,
  body: structuredClone(seededDraft.body),
});

const emptyNewDraft = ref<DocumentDraftView>({
  ...emptyDraft,
  body: structuredClone(emptyDraft.body),
});
</script>

<template>
  <Story as-child name="WithHeader">
    <div class="flex h-full min-h-0 overflow-hidden">
      <DocumentSurface>
        <template #header>
          <DocumentHeader :header="readyDocumentView.header" />
        </template>
        <DocumentEditor v-model="draft" :view="toDocumentEditorView(readyDocumentView)" />
      </DocumentSurface>
    </div>
  </Story>
  <Story as-child name="PeekShell">
    <div class="flex h-[36rem] min-h-0 overflow-hidden rounded-xl border border-border">
      <DocumentSurface>
        <DocumentEditor v-model="emptyNewDraft" :view="toDocumentEditorView(readyDocumentView)" />
      </DocumentSurface>
    </div>
  </Story>
</template>
