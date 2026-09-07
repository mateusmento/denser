<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDoc } from "@/modules/rich-text";
import { schedulePresets } from "../fixtures";
import RescheduleScheduleDialog from "../presentationals/RescheduleScheduleDialog.vue";

const { Story } = defineMeta({
  title: "features/conversation/RescheduleScheduleDialog",
  component: RescheduleScheduleDialog,
  tags: ["autodocs"],
});

const open = ref(true);
</script>

<template>
  <Story as-child name="Open">
    <RescheduleScheduleDialog
      v-model:open="open"
      :presets="schedulePresets"
      :message="{
        id: 'job-1',
        senderId: 'user-1',
        isMine: true,
        body: emptyDoc(),
        dueAt: '2026-08-11T14:00:00.000Z',
        dueAtLabel: 'Aug 11, 2:00 PM',
        threadId: null,
        attachments: [],
        processed: false,
      }"
    />
  </Story>
</template>
