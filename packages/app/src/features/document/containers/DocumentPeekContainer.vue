<script setup lang="ts">
import type { SpaceId, ArtifactId, PropertyDefinition } from "@denser/contracts";
import { computed, ref } from "vue";
import type { MentionCandidate } from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import { createDocumentDraftState, useDocumentSync } from "../composables/useDocumentSync";
import { toDocumentEditorView, type DocumentPropertiesView } from "../types";
import { toDocumentPropertiesView } from "../lib/document-properties-view";
import DocumentEditor from "../presentationals/DocumentEditor.vue";
import DocumentPropertiesPanel from "../presentationals/DocumentPropertiesPanel.vue";
import DocumentSurface from "../presentationals/DocumentSurface.vue";
import { toReadonlyRef } from "@/lib/vue";

const props = defineProps<{
  spaceId?: SpaceId | null;
  navigateOnCreate?: boolean;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const artifactId = ref<ArtifactId | undefined>();
const peekSpaceId = toReadonlyRef(() => props.spaceId ?? undefined);

const { draft, dirty } = createDocumentDraftState();
const sync = useDocumentSync(artifactId, {
  mode: "peek",
  peekSpaceId,
  navigateOnCreate: props.navigateOnCreate,
  onPeekComplete: () => emit("complete"),
  onPeekCreated: (id) => {
    artifactId.value = id;
  },
});

const {
  surfaceView,
  spaceMembers,
  relationSpaces,
  exploreRelationSpace,
  relationDocumentsBySpaceId,
  loadRelationDocuments,
  currentSpaceId,
  currentDocumentId,
  bindDraft,
  reload,
  addDocumentTypeProperty,
  deleteDocumentTypeProperty,
  renameDocumentTypeProperty,
  duplicateDocumentTypeProperty,
  editDocumentTypeProperty,
  addDocumentTypeOptionAndSetValue,
} = sync;

bindDraft(draft, dirty);

const mentionItems = ref<MentionCandidate[]>([]);

const editorView = computed(() => ({
  ...toDocumentEditorView(surfaceView.value),
  mentionItems: mentionItems.value,
}));

const propertiesView = computed((): DocumentPropertiesView =>
  toDocumentPropertiesView({
    schema: surfaceView.value.propertiesSchema ?? [],
    values: draft.value.properties ?? {},
    canManage: surfaceView.value.canManage ?? true,
    editable: surfaceView.value.canEdit,
    members: spaceMembers.value,
    currentSpaceId: currentSpaceId.value ?? peekSpaceId.value,
    currentDocumentId: currentDocumentId.value,
    relationSpaces: relationSpaces.value,
    relationDocumentsBySpaceId: relationDocumentsBySpaceId.value,
  }),
);

function onMentionSearch(query: string) {
  mentionItems.value = documentMentionItems(query);
}

function setDraftProperty(key: string, value: unknown) {
  if (!draft.value.properties) {
    draft.value.properties = {};
  }
  draft.value.properties[key] = value;
}

async function uploadImage(file: File) {
  return URL.createObjectURL(file);
}

async function onCreateOptionAndSelect(property: PropertyDefinition, name: string) {
  await addDocumentTypeOptionAndSetValue(
    property,
    name,
    draft.value.properties?.[property.key],
    setDraftProperty,
  );
}
</script>

<template>
  <DocumentSurface>
    <DocumentEditor
      v-model="draft"
      :view="editorView"
      :upload-image="uploadImage"
      @retry="reload"
      @mention-search="onMentionSearch"
    >
      <template #properties>
        <DocumentPropertiesPanel
          :view="propertiesView"
          @update-value="setDraftProperty"
          @add-property="addDocumentTypeProperty"
          @delete-property="deleteDocumentTypeProperty"
          @rename-property="renameDocumentTypeProperty"
          @duplicate-property="duplicateDocumentTypeProperty"
          @edit-property="editDocumentTypeProperty"
          @create-option-and-select="onCreateOptionAndSelect"
          @load-relation-documents="loadRelationDocuments"
          @explore-relation-space="exploreRelationSpace"
        />
      </template>
    </DocumentEditor>
  </DocumentSurface>
</template>
