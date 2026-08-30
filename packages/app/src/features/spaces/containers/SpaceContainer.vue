<script setup lang="ts">
import type { ArtifactId, ArtifactSummary, SpaceId, WorkflowStageId } from "@denser/contracts";
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceSettingsHost,
} from "@/modules/spaces";
import { useArtifactPeekHost, useWorkspaceCreateActions } from "@/modules/workspace";
import { useSpaceSync } from "../composables/useSpaceSync";
import {
  backlogSections,
  boardColumns,
  parseSpaceViewQuery,
} from "../lib/planning";
import BacklogSurface from "../presentationals/BacklogSurface.vue";
import BoardSurface from "../presentationals/BoardSurface.vue";
import SpaceSettingsContainer from "./SpaceSettingsContainer.vue";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const route = useRoute();
const spaceId = computed(() => route.params.spaceId as SpaceId | undefined);
const spaceView = computed(() => parseSpaceViewQuery(route.query.view));

const {
  view,
  content,
  backLink,
  detail,
  reload,
  createSpace,
  openSpace,
  startSprint,
  completeSprint,
  isStartingSprint,
  isCompletingSprint,
  moveDocument,
  transitionDocument,
} = useSpaceSync(spaceId);
const spaceCommands = useSpaceCommands();
const artifactCommands = useArtifactCommands();
const { settingsOpen, settingsSpaceId, settingsTitle, openSettings } = useSpaceSettingsHost();
const { onCreate } = useWorkspaceCreateActions((title, parentSpaceId, preset) =>
  createSpace(title, parentSpaceId ?? spaceId.value, preset),
);
const { openPeek } = useArtifactPeekHost();

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

function openArtifact(artifact: ArtifactSummary) {
  artifactCommands.openArtifact({
    id: artifact.id,
    kind: artifact.kind,
  });
}

const backlog = computed(() => {
  const data = detail.value;
  if (!data) return [];
  return backlogSections({
    space: data.space,
    artifacts: data.artifacts,
    childSpaces: data.childSpaces,
  });
});

const board = computed(() => {
  const data = detail.value;
  if (!data) return [];
  return boardColumns({
    space: data.space,
    workflow: data.workflow,
    artifacts: data.artifacts,
  });
});

const showBacklog = computed(
  () => spaceView.value === "backlog" && detail.value?.space.showBacklog === true,
);
const showBoard = computed(
  () => spaceView.value === "board" && detail.value?.space.showBoard === true,
);
</script>

<template>
  <BacklogSurface
    v-if="showBacklog"
    :sections="backlog"
    :can-manage="detail?.canManage"
    :sprinting-enabled="detail?.space.sprintingEnabled"
    :has-active-sprint="detail?.space.activeSprintId != null"
    :is-starting="isStartingSprint"
    :is-completing="isCompletingSprint"
    @open="openArtifact"
    @create="(id) => openPeek('document', id as SpaceId)"
    @move="(payload) => moveDocument({ artifactId: payload.artifactId as ArtifactId, toSpaceId: payload.toSpaceId as SpaceId, toIndex: payload.toIndex })"
    @start="startSprint"
    @complete="completeSprint"
  />

  <BoardSurface
    v-else-if="showBoard"
    :columns="board"
    :empty-until-start="detail?.space.sprintingEnabled === true && detail.space.activeSprintId == null"
    :can-manage="detail?.canManage"
    :is-starting="isStartingSprint"
    @open="openArtifact"
    @drop="(payload) => transitionDocument({ artifactId: payload.artifactId as ArtifactId, stageId: payload.stageId as WorkflowStageId })"
    @start="startSprint"
  />

  <SpaceSurface
    v-else
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
