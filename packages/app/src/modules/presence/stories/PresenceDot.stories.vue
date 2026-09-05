<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import PresenceDot from "../presentationals/PresenceDot.vue";

const { Story } = defineMeta({
  title: "modules/presence/PresenceDot",
  component: PresenceDot,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Online">
    <div class="relative size-8 rounded-full bg-muted">
      <PresenceDot online class="border-background" />
    </div>
  </Story>
  <Story as-child name="Offline">
    <div class="relative size-8 rounded-full bg-muted">
      <PresenceDot :online="false" class="border-background" />
    </div>
  </Story>
</template>
