<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import PermissionEmpty from "../presentationals/PermissionEmpty.vue";

const { Story } = defineMeta({
  title: "features/conversation/PermissionEmpty",
  component: PermissionEmpty,
  tags: ["autodocs"],
});
</script>

<template>
  <Story name="Default" />
</template>
