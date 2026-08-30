<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { action } from "storybook/actions";
import WorkspaceCreateMenu from "../presentationals/WorkspaceCreateMenu.vue";

const { Story } = defineMeta({
  title: "modules/workspace/WorkspaceCreateMenu",
  component: WorkspaceCreateMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});
</script>

<template>
  <Story as-child name="Default">
    <WorkspaceCreateMenu @create="action('create')($event)" />
  </Story>
  <Story as-child name="Sidebar">
    <WorkspaceCreateMenu variant="sidebar" @create="action('create')($event)" />
  </Story>
</template>
