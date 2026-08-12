<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { schedulePresets } from "../fixtures";
import SchedulePopover from "../presentationals/SchedulePopover.vue";

const { Story } = defineMeta({
  title: "features/conversation/SchedulePopover",
  component: SchedulePopover,
  tags: ["autodocs"],
});

const open = ref(true);
</script>

<template>
  <Story as-child name="Open">
    <SchedulePopover v-model:open="open" :presets="schedulePresets" />
  </Story>
</template>
