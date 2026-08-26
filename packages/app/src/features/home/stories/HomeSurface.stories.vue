<script setup lang="ts">
import type { HomeContentView, HomeSurfaceView } from "../types";
import {
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
} from "@denser/contracts";
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import HomeSurface from "../presentationals/HomeSurface.vue";

const { Story } = defineMeta({
  title: "features/home/HomeSurface",
  component: HomeSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const readyView: HomeSurfaceView = { state: "ready" };
const loadingView: HomeSurfaceView = { state: "loading" };
const errorView: HomeSurfaceView = { state: "error", errorMessage: "Couldn’t load home." };

const content: HomeContentView = {
  spaces: [{ id: SEED_SPACE_ACME, title: "Acme", icon: null, parentSpaceId: null }],
  artifacts: [
    {
      id: SEED_ARTIFACT_PERSONAL_NOTES,
      title: "Personal notes",
      kind: "document",
      version: 1,
      spaceId: null,
    },
  ],
};
</script>

<template>
  <Story as-child name="Ready">
    <HomeSurface
      :view="readyView"
      :content="content"
      @create-space="action('createSpace')()"
      @create-document="action('createDocument')()"
      @open-space="action('openSpace')($event)"
      @open-artifact="action('openArtifact')($event)"
      @space-action="(kind, space) => action('spaceAction')(kind, space)"
      @artifact-action="(kind, artifact) => action('artifactAction')(kind, artifact)"
      @retry="action('retry')()"
    />
  </Story>
  <Story as-child name="Loading">
    <HomeSurface :view="loadingView" />
  </Story>
  <Story as-child name="Error">
    <HomeSurface :view="errorView" @retry="action('retry')()" />
  </Story>
</template>
