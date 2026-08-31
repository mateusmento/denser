<script setup lang="ts">
import type { SpaceBackLink, SpaceContentView, SpaceSurfaceView } from "../types";
import {
  DEFAULT_SPACE_PLANNING,
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
  SEED_USER_ALICE,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceSurface from "../presentationals/SpaceSurface.vue";

const { Story } = defineMeta({
  title: "features/spaces/SpaceSurface",
  component: SpaceSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const readyView: SpaceSurfaceView = { state: "ready" };
const loadingView: SpaceSurfaceView = { state: "loading" };
const errorView: SpaceSurfaceView = { state: "error", errorMessage: "Couldn’t load space." };

const now = "2026-01-01T00:00:00.000Z";

const content: SpaceContentView = {
  space: {
    id: SEED_SPACE_ACME,
    title: "Acme",
    icon: "briefcase" as const,
    parentSpaceId: null,
    rootSpaceId: SEED_SPACE_ACME,
    visibility: "private",
    createdBy: SEED_USER_ALICE,
    ...DEFAULT_SPACE_PLANNING,
    createdAt: now,
    updatedAt: now,
  },
  childSpaces: [
    {
      id: SEED_SPACE_ENGINEERING,
      title: "Engineering",
      icon: "code" as const,
      parentSpaceId: SEED_SPACE_ACME,
      rootSpaceId: SEED_SPACE_ACME,
      visibility: "public",
      createdBy: SEED_USER_ALICE,
      ...DEFAULT_SPACE_PLANNING,
      createdAt: now,
      updatedAt: now,
    },
  ],
  artifacts: [
    {
      id: SEED_ARTIFACT_ONBOARDING_NOTES,
      title: "Onboarding notes",
      kind: "document",
      spaceId: SEED_SPACE_ACME,
      rootSpaceId: SEED_SPACE_ACME,
      createdBy: SEED_USER_ALICE,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

const rootBackLink: SpaceBackLink = { label: "Home", to: { name: "home" } };

const nestedContent: SpaceContentView = {
  ...content,
  space: content.childSpaces[0]!,
  childSpaces: [],
  artifacts: [],
};

const nestedBackLink: SpaceBackLink = {
  label: "Acme",
  to: { name: "space", params: { spaceId: SEED_SPACE_ACME } },
};
</script>

<template>
  <Story as-child name="Ready">
    <SpaceSurface
      :view="readyView"
      :content="content"
      :back-link="rootBackLink"
      @create="action('create')($event)"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
      :move-spaces="[
        { id: content.space.id, title: content.space.title, parentId: content.space.parentSpaceId },
        {
          id: content.childSpaces[0]!.id,
          title: content.childSpaces[0]!.title,
          parentId: content.childSpaces[0]!.parentSpaceId,
        },
      ]"
      @explore="action('explore')($event)"
      @move="action('move')($event)"
      @move-space="action('moveSpace')($event)"
      @retry="action('retry')()"
    />
  </Story>
  <Story as-child name="Nested">
    <SpaceSurface
      :view="readyView"
      :content="nestedContent"
      :back-link="nestedBackLink"
      @create="action('create')($event)"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
      :move-spaces="[
        { id: content.space.id, title: content.space.title, parentId: content.space.parentSpaceId },
        {
          id: nestedContent.space.id,
          title: nestedContent.space.title,
          parentId: nestedContent.space.parentSpaceId,
        },
      ]"
      @explore="action('explore')($event)"
      @move="action('move')($event)"
      @move-space="action('moveSpace')($event)"
      @retry="action('retry')()"
    />
  </Story>
  <Story as-child name="Loading">
    <SpaceSurface :view="loadingView" />
  </Story>
  <Story as-child name="Error">
    <SpaceSurface :view="errorView" @retry="action('retry')()" />
  </Story>
</template>
