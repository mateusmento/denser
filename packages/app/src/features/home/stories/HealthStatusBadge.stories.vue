<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import HealthStatusBadge from "../presentationals/HealthStatusBadge.vue";

const { Story } = defineMeta({
  title: "features/home/HealthStatusBadge",
  component: HealthStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["unknown", "ok", "error"],
    },
  },
});
</script>

<template>
  <Story name="Unknown" :args="{ status: 'unknown' }" />
  <Story name="Ok" :args="{ status: 'ok' }" />
  <Story name="ErrorState" :args="{ status: 'error' }" />
</template>
