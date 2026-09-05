<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { emptyDoc } from "@/modules/rich-text";
import ConversationSchedulesList from "../presentationals/ConversationSchedulesList.vue";
import type { ScheduledMessageView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ConversationSchedulesList",
  component: ConversationSchedulesList,
  tags: ["autodocs"],
});

const sample: readonly ScheduledMessageView[] = [
  {
    id: "job-1",
    senderId: "user-1",
    isMine: true,
    body: emptyDoc(),
    dueAt: "2026-08-11T14:00:00.000Z",
    dueAtLabel: "Aug 11, 2026, 2:00 PM",
    threadId: null,
    attachments: [
      {
        id: "att-1",
        name: "spec.pdf",
        mimeType: "application/pdf",
        url: "#",
        byteSize: 1200,
        kind: "file",
      },
    ],
    processed: false,
  },
];
</script>

<template>
  <Story as-child name="With items">
    <ConversationSchedulesList :schedules="sample" />
  </Story>
  <Story as-child name="Empty">
    <ConversationSchedulesList :schedules="[]" />
  </Story>
</template>
