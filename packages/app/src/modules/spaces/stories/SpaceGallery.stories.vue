<script setup lang="ts">
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
} from "@denser/contracts";
import type { ArtifactId, SpaceId } from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceGallery from "../presentationals/SpaceGallery.vue";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceGallery",
  component: SpaceGallery,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const childSpaces = [
  {
    id: SEED_SPACE_ENGINEERING,
    title: "Engineering",
    icon: "code" as const,
    parentSpaceId: SEED_SPACE_ACME,
  },
];

const artifacts = [
  {
    id: SEED_ARTIFACT_ONBOARDING_NOTES,
    title: "Onboarding notes",
    kind: "document" as const,
    version: 1,
    spaceId: SEED_SPACE_ENGINEERING,
  },
];

const manyFolders = Array.from({ length: 6 }, (_, index) => ({
  id: `${SEED_SPACE_ACME.slice(0, -1)}${index}` as SpaceId,
  title: `Space ${index + 1}`,
  icon: null,
  parentSpaceId: SEED_SPACE_ACME,
}));

const manyArtifacts = Array.from({ length: 8 }, (_, index) => ({
  id: `${SEED_ARTIFACT_ONBOARDING_NOTES.slice(0, -1)}${index}` as ArtifactId,
  title: `Document ${index + 1}`,
  kind: "document" as const,
  version: 1,
  spaceId: SEED_SPACE_ACME,
}));
</script>

<template>
  <Story as-child name="Mixed">
    <SpaceGallery
      :child-spaces="childSpaces"
      :artifacts="artifacts"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
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
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
    />
  </Story>
</template>
