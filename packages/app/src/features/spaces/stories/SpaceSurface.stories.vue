<script setup lang="ts">
import type { SpaceContentView, SpaceSurfaceView } from "../types";
import {
  SEED_SPACE_ACME,
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
    parentSpaceId: null,
    rootSpaceId: SEED_SPACE_ACME,
    visibility: "private",
    createdBy: SEED_USER_ALICE,
    createdAt: now,
    updatedAt: now,
  },
  childSpaces: [],
  artifacts: [],
};
</script>

<template>
  <Story as-child name="Ready">
    <SpaceSurface
      :view="readyView"
      :content="content"
      @create-space="action('createSpace')()"
      @create-document="action('createDocument')()"
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
