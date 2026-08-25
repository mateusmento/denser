<script setup lang="ts">
import type { SpaceDetailView } from "../types";
import {
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

const readyView = { state: "ready" as const };
const loadingView = { state: "loading" as const };
const errorView = { state: "error" as const, errorMessage: "Couldn’t load space." };

const now = "2026-01-01T00:00:00.000Z";

const detail: SpaceDetailView = {
  space: {
    id: SEED_SPACE_ACME,
    title: "Acme",
    parentSpaceId: null,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: SEED_USER_ALICE,
    createdAt: now,
    updatedAt: now,
  },
  childSpaces: [
    {
      id: SEED_SPACE_ENGINEERING,
      title: "Engineering",
      parentSpaceId: SEED_SPACE_ACME,
      rootSpaceId: SEED_SPACE_ACME,
      createdBy: SEED_USER_ALICE,
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
</script>

<template>
  <Story as-child name="Ready">
    <SpaceSurface
      :view="readyView"
      :detail="detail"
      @open-space="action('openSpace')($event)"
      @open-document="action('openDocument')($event)"
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
