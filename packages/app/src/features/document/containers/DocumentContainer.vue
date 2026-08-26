<script setup lang="ts">
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { MentionCandidate } from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import {
  createDocumentDraftState,
  useDocumentSync,
} from "../composables/useDocumentSync";
import { isNewDocumentRoute } from "../lib/routes";
import DocumentSurface from "../presentationals/DocumentSurface.vue";

const route = useRoute();
const isCompose = computed(() =>
  isNewDocumentRoute(route.params.documentId as string | undefined),
);
const artifactId = computed(() =>
  isCompose.value ? undefined : (route.params.documentId as ArtifactId),
);
const composeSpaceId = computed(() =>
  isCompose.value ? (route.query.spaceId as SpaceId | undefined) : undefined,
);

const documentScopeKey = computed(() =>
  isCompose.value ? `compose:${composeSpaceId.value ?? "root"}` : (artifactId.value ?? ""),
);

const { draft, dirty } = createDocumentDraftState();
const { surfaceView, bindDraft, reload } = useDocumentSync(artifactId, {
  isCompose,
  composeSpaceId,
});

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
    :key="documentScopeKey"
    v-model="draft"
    :view="view"
    :upload-image="uploadImage"
    @retry="reload"
    @mention-search="onMentionSearch"
  />
</template>
