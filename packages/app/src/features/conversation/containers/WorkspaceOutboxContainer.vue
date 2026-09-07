<script setup lang="ts">
import { toast } from "@denser/design-system";
import type { ArtifactId, ScheduledJobId, SpaceId } from "@denser/contracts";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useWorkspaceOutboxSync } from "../composables/useWorkspaceOutboxSync";
import { useWorkspaceNavSync } from "@/features/shell/composables/useWorkspaceNavSync";
import { schedulePresets } from "../fixtures";
import { toScheduledMessageViewFromOutboxItem } from "../lib/toScheduledMessageView";
import RescheduleScheduleDialog from "../presentationals/RescheduleScheduleDialog.vue";
import WorkspaceOutboxList from "../presentationals/WorkspaceOutboxList.vue";
import type { ScheduleCommitPayload } from "../types";
import { apiClient } from "@/lib/api";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";

const props = defineProps<{
  kind: "drafts" | "scheduled";
}>();

const router = useRouter();
const nav = useWorkspaceNavSync();
const { user } = useAuthSession();
const rootSpaceId = computed(
  (): SpaceId | null | undefined => nav.view.value.activeRootSpaceId as SpaceId | null | undefined,
);
const outbox = useWorkspaceOutboxSync(rootSpaceId);

const scheduleEditOpen = ref(false);
const editingJobId = ref<ScheduledJobId | null>(null);
const editingConversationId = ref<ArtifactId | null>(null);

const editingSchedule = computed(() => {
  if (!editingJobId.value) return undefined;
  const item = outbox.scheduledItems.value.find((row) => row.jobId === editingJobId.value);
  return item ? toScheduledMessageViewFromOutboxItem(item, user.value) : undefined;
});

function navigateToConversation(conversationId: string, threadId: string | null) {
  void router.push({
    name: "conversation",
    params: { conversationId },
    ...(threadId ? { query: { thread: threadId } } : {}),
  });
}

function onOpenDraft(id: string) {
  const draft = outbox.drafts.value.find((row) => row.id === id);
  if (!draft) return;
  navigateToConversation(draft.conversationId, draft.threadId);
}

function onOpenScheduled(id: string) {
  const item = outbox.scheduledMessages.value.find((row) => row.id === id);
  if (!item) return;
  void router.push({
    name: "conversation",
    params: { conversationId: item.conversationId },
    query: {
      ...(item.threadId ? { thread: item.threadId } : {}),
      scheduledEdit: id,
    },
  });
}

function onRescheduleScheduled(id: string) {
  const item = outbox.scheduledItems.value.find((row) => row.jobId === id);
  if (!item) return;
  editingJobId.value = item.jobId;
  editingConversationId.value = item.conversationId;
  scheduleEditOpen.value = true;
}

async function onSaveScheduleEdit(payload: ScheduleCommitPayload) {
  if (!editingJobId.value || !editingConversationId.value) return;
  try {
    await apiClient.updateScheduledMessage(editingConversationId.value, editingJobId.value, {
      dueAt: payload.dueAtIso,
      recurrence: payload.recurrence,
      weekdays: payload.weekdays,
      until: payload.until,
    });
    toast(`Schedule updated · ${payload.whenLabel}`);
    void outbox.invalidate();
  } catch {
    toast("Couldn't update schedule");
  }
}
</script>

<template>
  <WorkspaceOutboxList
    :kind="props.kind"
    :title="props.kind === 'drafts' ? 'Drafts' : 'Scheduled'"
    :drafts="outbox.drafts.value"
    :scheduled="outbox.scheduledMessages.value"
    :loading="
      props.kind === 'drafts'
        ? outbox.isDraftsLoading.value
        : outbox.isScheduledLoading.value
    "
    :error-label="
      props.kind === 'drafts' && outbox.draftsError.value
        ? 'Couldn\u2019t load drafts.'
        : props.kind === 'scheduled' && outbox.scheduledError.value
          ? 'Couldn\u2019t load scheduled messages.'
          : undefined
    "
    @open-draft="onOpenDraft"
    @open-scheduled="onOpenScheduled"
    @edit-scheduled-message="onOpenScheduled"
    @reschedule-scheduled="onRescheduleScheduled"
    @cancel-scheduled="onOpenScheduled"
  />

  <RescheduleScheduleDialog
    v-model:open="scheduleEditOpen"
    :message="editingSchedule"
    :presets="schedulePresets"
    :user-timezone="user?.timezone ?? null"
    :scheduler-user-id="user?.id ?? null"
    @save="onSaveScheduleEdit"
  />
</template>
