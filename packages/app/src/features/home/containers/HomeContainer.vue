<script setup lang="ts">
import { computed } from "vue";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceSettingsHost,
} from "@/modules/spaces";
import { prompt } from "@/lib/dialog";
import { useHomeSync } from "../composables/useHomeSync";
import HomeSurface from "../presentationals/HomeSurface.vue";
import SpaceSettingsContainer from "@/features/spaces/containers/SpaceSettingsContainer.vue";

const { view, spaces, artifacts, reload, createSpace, createDocument, openSpace, openDocument } =
  useHomeSync();
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

const content = computed(() => {
  if (view.value.state !== "ready") return undefined;
  return {
    spaces: spaces.value,
    artifacts: artifacts.value,
  };
});

async function onCreateSpace() {
  const title = await prompt({
    title: "New space",
    label: "Space name",
    placeholder: "Acme",
    confirmLabel: "Create",
  });
  if (!title?.trim()) return;
  await createSpace(title.trim());
}
</script>

<template>
  <HomeSurface
    :view="view"
    :content="content"
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
