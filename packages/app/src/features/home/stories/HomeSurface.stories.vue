<script setup lang="ts">
import type { HomeSurfaceView } from "../types";
import { defineMeta } from "sb-addon-vue-csf";
import HomeSurface from "../presentationals/HomeSurface.vue";

const { Story } = defineMeta({
  title: "features/home/HomeSurface",
  component: HomeSurface,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const readyView: HomeSurfaceView = { state: "ready" };
const errorView: HomeSurfaceView = { state: "error", errorMessage: "Couldn’t load home." };
</script>

<template>
  <Story as-child name="Ready">
    <HomeSurface :view="readyView" />
  </Story>
  <Story as-child name="Error">
    <HomeSurface :view="errorView" />
  </Story>
</template>
