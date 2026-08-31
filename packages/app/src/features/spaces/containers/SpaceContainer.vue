<script setup lang="ts">
import type { ArtifactId, ArtifactSummary, SpaceId, WorkflowStageId } from "@denser/contracts";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  useArtifactCommands,
  useGalleryActions,
  useSpaceCommands,
  useSpaceMoveTree,
  useSpaceSettingsHost,
  type SpaceMoveDestination,
} from "@/modules/spaces";
import { useArtifactPeekHost, useWorkspaceCreateActions } from "@/modules/workspace";
import { useSpaceSync } from "../composables/useSpaceSync";
import {
  backlogSections,
  boardColumns,
  parseSpaceViewQuery,
  placeInBacklog,
  placeInBoard,
  type BacklogSection,
  type BoardColumn,
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
const { spaces: moveSpaces, explore: exploreMove } = useSpaceMoveTree();

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

function destinationSpaceId(to: SpaceMoveDestination): SpaceId | null {
  return to.kind === "home" ? null : (to.spaceId as SpaceId);
}

function moveGalleryArtifact(payload: { artifactId: string; to: SpaceMoveDestination }) {
  const artifact = content.value?.artifacts.find((entry) => entry.id === payload.artifactId);
  if (!artifact) return;
  void artifactCommands.moveArtifact(artifact, destinationSpaceId(payload.to));
}

function moveGallerySpace(payload: { spaceId: string; to: SpaceMoveDestination }) {
  const space = content.value?.childSpaces.find((entry) => entry.id === payload.spaceId);
  if (!space) return;
  void spaceCommands.moveSpace(space, destinationSpaceId(payload.to));
}

const placedBacklog = ref<BacklogSection[] | null>(null);
const placedBoard = ref<BoardColumn[] | null>(null);

watch(
  () => detail.value?.artifacts,
  () => {
    placedBacklog.value = null;
    placedBoard.value = null;
  },
);

const backlog = computed(() => {
  if (placedBacklog.value) return placedBacklog.value;
  const data = detail.value;
  if (!data) return [];
  return backlogSections({
    space: data.space,
    artifacts: data.artifacts,
    childSpaces: data.childSpaces,
  });
});

const board = computed(() => {
  if (placedBoard.value) return placedBoard.value;
  const data = detail.value;
  if (!data) return [];
  return boardColumns({
    space: data.space,
    workflow: data.workflow,
    artifacts: data.artifacts,
  });
});

async function onBacklogMove(payload: {
  artifactId: string;
  toSpaceId: string;
  afterId: string | null;
  beforeId: string | null;
}) {
  placedBacklog.value = placeInBacklog(backlog.value, payload);
  const ok = await moveDocument({
    artifactId: payload.artifactId as ArtifactId,
    toSpaceId: payload.toSpaceId as SpaceId,
    afterId: payload.afterId as ArtifactId | null,
    beforeId: payload.beforeId as ArtifactId | null,
  });
  if (!ok) placedBacklog.value = null;
}

async function onBoardDrop(payload: {
  artifactId: string;
  stageId: string;
  afterId: string | null;
  beforeId: string | null;
}) {
  placedBoard.value = placeInBoard(board.value, payload);
  const ok = await transitionDocument({
    artifactId: payload.artifactId as ArtifactId,
    stageId: payload.stageId as WorkflowStageId,
    afterId: payload.afterId as ArtifactId | null,
    beforeId: payload.beforeId as ArtifactId | null,
  });
  if (!ok) placedBoard.value = null;
}

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
    @move="onBacklogMove"
    @start="startSprint"
    @complete="completeSprint"
  />

  <BoardSurface
    v-else-if="showBoard"
    :columns="board"
    :empty-until-start="
      detail?.space.sprintingEnabled === true && detail.space.activeSprintId == null
    "
    :can-manage="detail?.canManage"
    :is-starting="isStartingSprint"
    @open="openArtifact"
    @drop="onBoardDrop"
    @start="startSprint"
  />

  <SpaceSurface
    v-else
    :view="view"
    :content="content"
    :back-link="backLink"
    :move-spaces="moveSpaces"
    @retry="reload"
    @create="onCreate($event, spaceId)"
    @open-space="openSpace"
    @open-artifact="
      (id) =>
        artifactCommands.openArtifact({
          id: id as ArtifactId,
          kind: content?.artifacts.find((a) => a.id === id)?.kind ?? 'document',
        })
    "
    @space-action="onSpaceAction"
    @artifact-action="onArtifactAction"
    @explore="exploreMove"
    @move="moveGalleryArtifact"
    @move-space="moveGallerySpace"
  />

  <SpaceSettingsContainer
    v-if="settingsSpaceId"
    v-model:open="settingsOpen"
    :space-id="settingsSpaceId"
    :title="settingsTitle"
  />
</template>
