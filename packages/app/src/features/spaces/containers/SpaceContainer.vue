<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { prompt } from "@/lib/dialog";
import { useArtifactCommands } from "../composables/useArtifactCommands";
import { useSpaceCommands } from "../composables/useSpaceCommands";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceSettingsContainer from "./SpaceSettingsContainer.vue";
import type {
  SpaceGalleryArtifact,
  SpaceGalleryArtifactAction,
  SpaceGallerySpace,
  SpaceGallerySpaceAction,
} from "../types";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const route = useRoute();
const spaceId = computed(() => route.params.spaceId as SpaceId | undefined);

const { view, content, backLink, reload, createSpace, createDocument, openSpace, openDocument } =
  useSpaceSync(spaceId);
const { renameSpaceWithDialog, deleteSpace } = useSpaceCommands();
const { renameArtifactWithDialog, duplicateArtifact, deleteArtifact } = useArtifactCommands();

const settingsOpen = ref(false);
const settingsSpaceId = ref<SpaceId | null>(null);
const settingsTitle = ref("");

async function onCreateSpace() {
  const title = await prompt({
    title: "New space",
    label: "Space name",
    placeholder: content.value?.space.title ?? "Untitled",
    confirmLabel: "Create",
  });
  if (!title?.trim()) return;
  await createSpace(title.trim());
}

async function onSpaceAction(action: SpaceGallerySpaceAction, space: SpaceGallerySpace) {
  if (action === "openSettings") {
    settingsSpaceId.value = space.id;
    settingsTitle.value = space.title;
    settingsOpen.value = true;
    return;
  }
  if (action === "open") {
    await openSpace(space.id);
    return;
  }
  if (action === "rename") {
    await renameSpaceWithDialog(space);
    return;
  }
  if (action === "delete") {
    await deleteSpace(space);
  }
}

async function onArtifactAction(action: SpaceGalleryArtifactAction, artifact: SpaceGalleryArtifact) {
  if (action === "open") {
    await openDocument(artifact.id);
    return;
  }
  if (action === "rename") {
    await renameArtifactWithDialog(artifact);
    return;
  }
  if (action === "duplicate") {
    await duplicateArtifact(artifact);
    return;
  }
  if (action === "delete") {
    await deleteArtifact(artifact);
  }
}
</script>

<template>
  <SpaceSurface
    :view="view"
    :content="content"
    :back-link="backLink"
    @retry="reload"
    @create-space="onCreateSpace"
    @create-document="createDocument"
    @open-space="openSpace"
    @open-artifact="openDocument"
    @space-action="onSpaceAction"
    @artifact-action="onArtifactAction"
  />

  <SpaceSettingsContainer
    v-if="settingsSpaceId"
    v-model:open="settingsOpen"
    :space-id="settingsSpaceId"
    :title="settingsTitle"
  />
</template>
