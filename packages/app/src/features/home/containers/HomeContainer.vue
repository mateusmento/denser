<script setup lang="ts">
import type { ArtifactId } from "@denser/contracts";
import { computed } from "vue";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceSettingsHost,
} from "@/modules/spaces";
import { useWorkspaceCreateActions } from "@/modules/workspace";
import { useHomeSync } from "../composables/useHomeSync";
import HomeSurface from "../presentationals/HomeSurface.vue";
import SpaceSettingsContainer from "@/features/spaces/containers/SpaceSettingsContainer.vue";

const { view, spaces, artifacts, reload, createSpace, openSpace } = useHomeSync();
const spaceCommands = useSpaceCommands();
const artifactCommands = useArtifactCommands();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();
const { onCreate } = useWorkspaceCreateActions(createSpace);

const { onSpaceAction, onArtifactAction } = useGalleryActions(
  {
    openSpace,
    openArtifact: artifactCommands.openArtifact,
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
</script>

<template>
  <HomeSurface
    :view="view"
    :content="content"
    @retry="reload"
    @create="onCreate($event, null)"
    @open-space="openSpace"
    @open-artifact="(id) => artifactCommands.openArtifact({ id: id as ArtifactId, kind: artifacts.find((a) => a.id === id)?.kind ?? 'document' })"
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
