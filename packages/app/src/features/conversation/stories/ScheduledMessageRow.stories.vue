<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { formatScheduleWallTime, scheduleRecurrenceLabel } from "../lib/formatScheduleWallTime";
import ScheduledMessageRow from "../presentationals/ScheduledMessageRow.vue";
import type { ConversationScheduledMessageView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ScheduledMessageRow",
  component: ScheduledMessageRow,
  tags: ["autodocs"],
});

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const nextRunAtIso = new Date(Date.now() + 86_400_000).toISOString();

const item: ConversationScheduledMessageView = {
  id: "sched-1",
  bodyPreview: "Weekly standup notes go out before the meeting.",
  nextRunAtIso,
  timezone,
  recurrenceLabel: scheduleRecurrenceLabel("weekly"),
  nextRunWallTimeLabel: formatScheduleWallTime(nextRunAtIso, timezone),
};
</script>

<template>
  <Story as-child name="Weekly">
    <ScheduledMessageRow :item="item" />
  </Story>
</template>
