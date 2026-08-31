<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
} from "@denser/contracts";
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import { ref } from "vue";
import SpaceGallery from "../presentationals/SpaceGallery.vue";
import type { SpaceMoveDestination, SpaceMoveNode } from "../lib/space-move-menu";
import type { SpaceGalleryArtifact, SpaceGallerySpace } from "../types";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceGallery",
  component: SpaceGallery,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const childSpaces = ref<SpaceGallerySpace[]>([
  {
    id: SEED_SPACE_ENGINEERING,
    title: "Engineering",
    icon: "code" as const,
    parentSpaceId: SEED_SPACE_ACME,
    sprintRole: null,
  },
  {
    id: `${SEED_SPACE_ENGINEERING.slice(0, -1)}2` as SpaceId,
    title: "Sprint 1",
    icon: "folder" as const,
    parentSpaceId: SEED_SPACE_ACME,
    sprintRole: "active" as const,
  },
  {
    id: `${SEED_SPACE_ENGINEERING.slice(0, -1)}3` as SpaceId,
    title: "Sprint 2",
    icon: "folder" as const,
    parentSpaceId: SEED_SPACE_ACME,
    sprintRole: "upcoming" as const,
  },
]);

const mixedArtifacts = ref<SpaceGalleryArtifact[]>([
  {
    id: SEED_ARTIFACT_ONBOARDING_NOTES,
    title: "Onboarding notes",
    kind: "document",
    version: 1,
    spaceId: SEED_SPACE_ACME,
  },
  {
    id: SEED_ARTIFACT_PERSONAL_NOTES,
    title: "Personal notes",
    kind: "document",
    version: 1,
    spaceId: SEED_SPACE_ACME,
  },
  {
    id: "00000000-0000-4000-8000-000000000024" as ArtifactId,
    title: "Standup",
    kind: "conversation",
    version: 1,
    spaceId: SEED_SPACE_ACME,
  },
]);

const manyFolders = ref<SpaceGallerySpace[]>(
  Array.from({ length: 6 }, (_, index) => ({
    id: `${SEED_SPACE_ACME.slice(0, -1)}${index}` as SpaceId,
    title: `Space ${index + 1}`,
    icon: null,
    parentSpaceId: SEED_SPACE_ACME,
    sprintRole: null,
  })),
);

const manyArtifacts = ref<SpaceGalleryArtifact[]>(
  Array.from({ length: 8 }, (_, index) => ({
    id: `${SEED_ARTIFACT_ONBOARDING_NOTES.slice(0, -1)}${index}` as ArtifactId,
    title: `Document ${index + 1}`,
    kind: "document",
    version: 1,
    spaceId: SEED_SPACE_ACME,
  })),
);

const moveSpaces: SpaceMoveNode[] = [
  { id: SEED_SPACE_ACME, title: "Acme", parentId: null },
  ...childSpaces.value.map((space) => ({
    id: space.id,
    title: space.title,
    parentId: space.parentSpaceId,
  })),
];

function applyMove(
  artifacts: SpaceGalleryArtifact[],
  payload: { artifactId: string; to: SpaceMoveDestination },
) {
  action("move")(payload);
  return artifacts.filter((artifact) => artifact.id !== payload.artifactId);
}

function applyMoveSpace(
  spaces: SpaceGallerySpace[],
  payload: { spaceId: string; to: SpaceMoveDestination },
) {
  action("moveSpace")(payload);
  return spaces.filter((space) => space.id !== payload.spaceId);
}
</script>

<template>
  <Story as-child name="Mixed">
    <SpaceGallery
      :child-spaces="childSpaces"
      :artifacts="mixedArtifacts"
      :move-spaces="moveSpaces"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
      @explore="action('explore')($event)"
      @move="(payload) => (mixedArtifacts = applyMove(mixedArtifacts, payload))"
      @move-space="(payload) => (childSpaces = applyMoveSpace(childSpaces, payload))"
    />
  </Story>

  <Story as-child name="Empty">
    <SpaceGallery
      :child-spaces="[]"
      :artifacts="[]"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
    />
  </Story>

  <Story as-child name="Loading">
    <SpaceGallery :child-spaces="[]" :artifacts="[]" loading />
  </Story>

  <Story as-child name="DenseGrid">
    <SpaceGallery
      :child-spaces="manyFolders"
      :artifacts="manyArtifacts"
      :move-spaces="moveSpaces"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
      @explore="action('explore')($event)"
      @move="(payload) => (manyArtifacts = applyMove(manyArtifacts, payload))"
      @move-space="(payload) => (manyFolders = applyMoveSpace(manyFolders, payload))"
    />
  </Story>
</template>
