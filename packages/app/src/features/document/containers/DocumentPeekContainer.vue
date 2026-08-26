<script setup lang="ts">
import type { SpaceId, ArtifactId } from "@denser/contracts";
import { computed, ref } from "vue";
import type { MentionCandidate } from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import {
  createDocumentDraftState,
  useDocumentSync,
} from "../composables/useDocumentSync";
import { toDocumentEditorView } from "../types";
import DocumentEditorContainer from "./DocumentEditorContainer.vue";
import DocumentSurface from "../presentationals/DocumentSurface.vue";
import { toReadonlyRef } from "@/lib/vue";

const props = defineProps<{
  spaceId?: SpaceId | null;
}>();

const artifactId = ref<ArtifactId | undefined>();
const peekSpaceId = toReadonlyRef(() => props.spaceId ?? undefined);

const { draft, dirty } = createDocumentDraftState();
const { surfaceView, bindDraft, reload } = useDocumentSync(artifactId, {
  mode: "peek",
  peekSpaceId,
  onPeekCreated: (id) => {
    artifactId.value = id;
  },
});

bindDraft(draft, dirty);

const mentionItems = ref<MentionCandidate[]>([]);

const editorView = computed(() => ({
  ...toDocumentEditorView(surfaceView.value),
  mentionItems: mentionItems.value,
}));

function onMentionSearch(query: string) {
  mentionItems.value = documentMentionItems(query);
}
</script>

<template>
  <DocumentSurface>
    <DocumentEditorContainer
      v-model="draft"
      :view="editorView"
      @retry="reload"
      @mention-search="onMentionSearch"
    />
  </DocumentSurface>
</template>
