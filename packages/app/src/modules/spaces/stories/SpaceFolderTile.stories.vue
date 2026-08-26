<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import SpaceFolderTile from "../presentationals/SpaceFolderTile.vue";

const { Story } = defineMeta({
  title: "modules/spaces/SpaceFolderTile",
  component: SpaceFolderTile,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});
</script>

<template>
  <Story as-child name="Default">
    <div class="w-48">
      <SpaceFolderTile
        title="Engineering"
        icon="code"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>

  <Story as-child name="FolderIcon">
    <div class="w-48">
      <SpaceFolderTile
        title="Acme"
        icon="folder"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>

  <Story as-child name="LongTitle">
    <div class="w-48">
      <SpaceFolderTile
        title="Platform infrastructure and developer experience"
        icon="rocket"
        @open="action('open')()"
        @action="action('action')($event)"
      />
    </div>
  </Story>
</template>
