<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { SpaceId } from "@denser/contracts";
import { useWorkspaceOutboxSync } from "../composables/useWorkspaceOutboxSync";
import { useWorkspaceNavSync } from "@/features/shell/composables/useWorkspaceNavSync";
import WorkspaceOutboxList from "../presentationals/WorkspaceOutboxList.vue";

const props = defineProps<{
  kind: "drafts" | "scheduled";
}>();

const router = useRouter();
const nav = useWorkspaceNavSync();
const rootSpaceId = computed(
  (): SpaceId | null | undefined => nav.view.value.activeRootSpaceId as SpaceId | null | undefined,
);
const outbox = useWorkspaceOutboxSync(rootSpaceId);

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
    @reschedule-scheduled="onOpenScheduled"
    @cancel-scheduled="onOpenScheduled"
  />
</template>
