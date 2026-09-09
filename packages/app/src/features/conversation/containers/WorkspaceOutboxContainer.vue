<script setup lang="ts">
import { toast } from "@denser/design-system";
import type { ArtifactId, ScheduledJobId, SpaceId } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceOutboxSync } from "../composables/useWorkspaceOutboxSync";
import { useWorkspaceNavSync } from "@/features/shell/composables/useWorkspaceNavSync";
import { schedulePresets } from "../fixtures";
import { toScheduledMessageViewFromOutboxItem } from "../lib/toScheduledMessageView";
import RescheduleScheduleDialog from "../presentationals/RescheduleScheduleDialog.vue";
import WorkspaceOutboxList from "../presentationals/WorkspaceOutboxList.vue";
import type { DraftsScheduledPanelTab, ScheduleCommitPayload } from "../types";
import { apiClient } from "@/lib/api";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";

function parseOutboxTab(value: unknown): DraftsScheduledPanelTab {
  return value === "scheduled" ? "scheduled" : "drafts";
}

const route = useRoute();
const router = useRouter();
const nav = useWorkspaceNavSync();
const { user } = useAuthSession();
const rootSpaceId = computed((): SpaceId | null => nav.workspaceRootId.value);
const outbox = useWorkspaceOutboxSync(rootSpaceId);

const tab = ref<DraftsScheduledPanelTab>(parseOutboxTab(route.query.tab));

watch(
  () => route.query.tab,
  (value) => {
    tab.value = parseOutboxTab(value);
  },
);

watch(tab, (value) => {
  if (parseOutboxTab(route.query.tab) === value) return;
  void router.replace({
    query: {
      ...route.query,
      tab: value === "drafts" ? undefined : value,
    },
  });
});

const scheduleEditOpen = ref(false);
const editingJobId = ref<ScheduledJobId | null>(null);
const editingConversationId = ref<ArtifactId | null>(null);

const editingSchedule = computed(() => {
  if (!editingJobId.value) return undefined;
  const item = outbox.scheduledItems.value.find((row) => row.jobId === editingJobId.value);
  return item ? toScheduledMessageViewFromOutboxItem(item, user.value) : undefined;
});

const rescheduleContextQuery = useQuery({
  queryKey: computed(
    () => ["workspace-schedule-context", editingConversationId.value] as const,
  ),
  enabled: computed(() => editingConversationId.value != null),
  queryFn: async () => {
    const { conversation } = await apiClient.getConversation(editingConversationId.value!);
    const conversationRootSpaceId = conversation.rootSpaceId;
    if (!conversationRootSpaceId) {
      return {
        members: [] as { userId: string; name: string; timezone: string | null }[],
        scheduleTimezone: conversation.scheduleTimezone ?? null,
      };
    }
    const detail = await apiClient.getSpace(conversationRootSpaceId);
    return {
      members: (detail.assignableMembers ?? detail.members).map((member) => ({
        userId: member.userId,
        name: member.name,
        timezone: member.timezone ?? null,
      })),
      scheduleTimezone: conversation.scheduleTimezone ?? null,
    };
  },
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

async function onCancelScheduled(id: string) {
  const item = outbox.scheduledItems.value.find((row) => row.jobId === id);
  if (!item) return;
  try {
    await apiClient.cancelScheduledMessage(item.conversationId, id as ScheduledJobId);
    toast("Scheduled message cancelled");
    void outbox.invalidate();
  } catch {
    toast("Couldn't cancel schedule");
  }
}
</script>

<template>
  <WorkspaceOutboxList
    v-model:tab="tab"
    :drafts="outbox.drafts.value"
    :scheduled="outbox.scheduledMessages.value"
    :drafts-loading="outbox.isDraftsLoading.value"
    :scheduled-loading="outbox.isScheduledLoading.value"
    :drafts-error-label="outbox.draftsError.value ? 'Couldn\u2019t load drafts.' : undefined"
    :scheduled-error-label="
      outbox.scheduledError.value ? 'Couldn\u2019t load scheduled messages.' : undefined
    "
    @open-draft="onOpenDraft"
    @open-scheduled="onOpenScheduled"
    @edit-scheduled-message="onOpenScheduled"
    @reschedule-scheduled="onRescheduleScheduled"
    @cancel-scheduled="onCancelScheduled"
  />

  <RescheduleScheduleDialog
    v-model:open="scheduleEditOpen"
    :message="editingSchedule"
    :presets="schedulePresets"
    :user-timezone="user?.timezone ?? null"
    :schedule-timezone="rescheduleContextQuery.data.value?.scheduleTimezone ?? null"
    :scheduler-user-id="user?.id ?? null"
    :members="rescheduleContextQuery.data.value?.members ?? []"
    @save="onSaveScheduleEdit"
  />
</template>
