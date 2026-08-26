<script setup lang="ts">
import type { SpaceId } from "@denser/contracts";
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceSettingsHost,
} from "@/modules/spaces";
import { prompt } from "@/lib/dialog";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceSettingsContainer from "./SpaceSettingsContainer.vue";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const route = useRoute();
const spaceId = computed(() => route.params.spaceId as SpaceId | undefined);

const { view, content, backLink, reload, createSpace, createDocument, openSpace, openDocument } =
  useSpaceSync(spaceId);
const spaceCommands = useSpaceCommands();
const artifactCommands = useArtifactCommands();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();

const { onSpaceAction, onArtifactAction } = useGalleryActions(
  {
    openSpace,
    openDocument,
    renameSpace: spaceCommands.renameSpace,
    deleteSpace: spaceCommands.deleteSpace,
    renameArtifact: artifactCommands.renameArtifact,
    deleteArtifact: artifactCommands.deleteArtifact,
    duplicateArtifact: artifactCommands.duplicateArtifact,
  },
  { openSettings },
);

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
