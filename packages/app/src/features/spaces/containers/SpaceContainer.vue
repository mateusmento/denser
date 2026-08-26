<script setup lang="ts">
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceSettingsHost,
} from "@/modules/spaces";
import { useWorkspaceCreateActions } from "@/modules/workspace";
import { useSpaceSync } from "../composables/useSpaceSync";
import SpaceSettingsContainer from "./SpaceSettingsContainer.vue";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const route = useRoute();
const spaceId = computed(() => route.params.spaceId as SpaceId | undefined);

const { view, content, backLink, reload, createSpace, openSpace } = useSpaceSync(spaceId);
const spaceCommands = useSpaceCommands();
const artifactCommands = useArtifactCommands();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();
const { onCreate } = useWorkspaceCreateActions((title, parentSpaceId) =>
  createSpace(title, parentSpaceId ?? spaceId.value),
);

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
</script>

<template>
  <SpaceSurface
    :view="view"
    :content="content"
    :back-link="backLink"
    @retry="reload"
    @create="onCreate($event, spaceId)"
    @open-space="openSpace"
    @open-artifact="(id) => artifactCommands.openArtifact({ id: id as ArtifactId, kind: content?.artifacts.find((a) => a.id === id)?.kind ?? 'document' })"
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
