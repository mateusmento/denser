<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import ThemeSwitcher from "../presentationals/ThemeSwitcher.vue";

const { Story } = defineMeta({
  title: "modules/theme/ThemeSwitcher",
  component: ThemeSwitcher,
  tags: ["autodocs"],
});
</script>

<template>
  <Story name="Default" />
</template>
