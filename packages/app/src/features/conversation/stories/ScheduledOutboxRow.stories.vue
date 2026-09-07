<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { formatScheduleWallTime, scheduleRecurrenceLabel } from "../lib/formatScheduleWallTime";
import ScheduledOutboxRow from "../presentationals/ScheduledOutboxRow.vue";
import type { ScheduledOutboxRowView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ScheduledOutboxRow",
  component: ScheduledOutboxRow,
  tags: ["autodocs"],
});

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const nextRunAtIso = new Date(Date.now() + 86_400_000).toISOString();

const item: ScheduledOutboxRowView = {
  id: "sched-1",
  conversationId: "conv-1",
  threadId: null,
  conversationLabel: "#engineering",
  contextLabel: "channel",
  bodyPreview: "Weekly standup notes go out before the meeting.",
  nextRunAtIso,
  timezone,
  recurrenceLabel: scheduleRecurrenceLabel({
    frequency: "weekly",
    timeOfDay: "09:00",
    weekdays: [1, 3, 5],
  }),
  nextRunWallTimeLabel: formatScheduleWallTime(nextRunAtIso, timezone),
};

const onceItem: ScheduledOutboxRowView = {
  ...item,
  id: "sched-2",
  threadId: "msg-thread",
  contextLabel: "thread",
  bodyPreview: "One-off reminder in a thread.",
  recurrenceLabel: scheduleRecurrenceLabel({ frequency: "once" }),
};
</script>

<template>
  <Story as-child name="Weekly">
    <ScheduledOutboxRow :item="item" />
  </Story>
  <Story as-child name="OnceInThread">
    <ScheduledOutboxRow :item="onceItem" />
  </Story>
</template>
