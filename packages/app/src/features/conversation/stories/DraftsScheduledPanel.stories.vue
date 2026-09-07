<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { formatScheduleWallTime, scheduleRecurrenceLabel } from "../lib/formatScheduleWallTime";
import DraftsScheduledPanel from "../presentationals/DraftsScheduledPanel.vue";
import type { DraftOutboxRowView, DraftsScheduledPanelTab, ScheduledOutboxRowView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/DraftsScheduledPanel",
  component: DraftsScheduledPanel,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const tab = ref<DraftsScheduledPanelTab>("drafts");
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const nextRunAtIso = new Date(Date.now() + 86_400_000).toISOString();

const drafts: DraftOutboxRowView[] = [
  {
    id: "draft-1",
    conversationId: "conv-1",
    threadId: null,
    conversationLabel: "#engineering",
    contextLabel: "channel",
    bodyPreview: "Standup notes draft — still editing.",
  },
  {
    id: "draft-2",
    conversationId: "conv-1",
    threadId: "msg-thread",
    conversationLabel: "#engineering",
    contextLabel: "thread",
    bodyPreview: "Thread reply draft.",
  },
];

const scheduled: ScheduledOutboxRowView[] = [
  {
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
  },
];

function onOpenDraft(id: string) {
  toast(`Open draft · ${id}`);
}

function onOpenScheduled(id: string) {
  toast(`Open scheduled · ${id}`);
}

function onEditScheduledMessage(id: string) {
  toast(`Edit scheduled · ${id}`);
}

function onRescheduleScheduled(id: string) {
  toast(`Reschedule · ${id}`);
}

function onCancelScheduled(id: string) {
  toast(`Cancel · ${id}`);
}
</script>

<template>
  <Story as-child name="WithItems">
    <div class="flex h-[32rem] w-[22rem] rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <DraftsScheduledPanel
        v-model:tab="tab"
        :drafts="drafts"
        :scheduled="scheduled"
        @close="toast('Close panel')"
        @open-draft="onOpenDraft"
        @open-scheduled="onOpenScheduled"
        @edit-scheduled-message="onEditScheduledMessage"
        @reschedule-scheduled="onRescheduleScheduled"
        @cancel-scheduled="onCancelScheduled"
      />
    </div>
  </Story>
  <Story as-child name="ScheduledTab">
    <div class="flex h-[32rem] w-[22rem] rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <DraftsScheduledPanel
        :tab="'scheduled'"
        :drafts="[]"
        :scheduled="scheduled"
        @close="toast('Close panel')"
        @open-draft="onOpenDraft"
        @open-scheduled="onOpenScheduled"
        @edit-scheduled-message="onEditScheduledMessage"
        @reschedule-scheduled="onRescheduleScheduled"
        @cancel-scheduled="onCancelScheduled"
      />
    </div>
  </Story>
  <Story as-child name="EmptyDrafts">
    <div class="flex h-[32rem] w-[22rem] rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <DraftsScheduledPanel
        :tab="'drafts'"
        :drafts="[]"
        :scheduled="[]"
        @close="toast('Close panel')"
        @open-draft="onOpenDraft"
        @open-scheduled="onOpenScheduled"
        @edit-scheduled-message="onEditScheduledMessage"
        @reschedule-scheduled="onRescheduleScheduled"
        @cancel-scheduled="onCancelScheduled"
      />
    </div>
  </Story>
  <Story as-child name="Loading">
    <div class="flex h-[32rem] w-[22rem] rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <DraftsScheduledPanel
        v-model:tab="tab"
        :drafts="drafts"
        :scheduled="scheduled"
        drafts-loading
        scheduled-loading
        @close="toast('Close panel')"
        @open-draft="onOpenDraft"
        @open-scheduled="onOpenScheduled"
        @edit-scheduled-message="onEditScheduledMessage"
        @reschedule-scheduled="onRescheduleScheduled"
        @cancel-scheduled="onCancelScheduled"
      />
    </div>
  </Story>
</template>
