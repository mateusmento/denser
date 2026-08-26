<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceArtifactTile from "../presentationals/SpaceArtifactTile.vue";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceArtifactTile",
  component: SpaceArtifactTile,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});
</script>

<template>
  <Story as-child name="Default">
    <div class="w-48">
      <SpaceArtifactTile
        title="Onboarding notes"
        kind="document"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>

  <Story as-child name="Untitled">
    <div class="w-48">
      <SpaceArtifactTile
        title=""
        kind="document"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>

  <Story as-child name="LongTitle">
    <div class="w-48">
      <SpaceArtifactTile
        title="Q3 planning notes and roadmap decisions for the platform team"
        kind="document"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>
</template>
