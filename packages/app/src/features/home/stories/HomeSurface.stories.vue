<script setup lang="ts">
import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_SPACE_ACME,
  SEED_USER_ALICE,
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

const readyView = { state: "ready" as const };
const loadingView = { state: "loading" as const };
const errorView = { state: "error" as const, errorMessage: "Couldn’t load home." };

const now = "2026-01-01T00:00:00.000Z";

const spaces: SpaceSummary[] = [
  {
    id: SEED_SPACE_ACME,
    title: "Acme",
    parentSpaceId: null,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: SEED_USER_ALICE,
    createdAt: now,
    updatedAt: now,
  },
];

const artifacts: ArtifactSummary[] = [
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
];
</script>

<template>
  <Story as-child name="Ready">
    <HomeSurface
      :view="readyView"
      :spaces="spaces"
      :artifacts="artifacts"
      @open-space="action('openSpace')($event)"
      @open-document="action('openDocument')($event)"
      @create-space="action('createSpace')()"
      @create-document="action('createDocument')()"
      @retry="action('retry')()"
    />
  </Story>
  <Story as-child name="Loading">
    <HomeSurface :view="loadingView" :spaces="[]" :artifacts="[]" />
  </Story>
  <Story as-child name="Error">
    <HomeSurface
      :view="errorView"
      :spaces="[]"
      :artifacts="[]"
      @retry="action('retry')()"
    />
  </Story>
</template>
