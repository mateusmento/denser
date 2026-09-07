import type { ArtifactId, AttachmentId, MessageId, ScheduledJobId, SpaceId } from "@denser/contracts";
import {
  SCHEDULED_MESSAGE_CANCELLED_EVENT,
  SCHEDULED_MESSAGE_UPSERTED_EVENT,
  type ScheduledMessageCancelledEvent,
  type ScheduledMessageUpsertedEvent,
} from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, onScopeDispose } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useConversationRoom } from "@/lib/realtime/useConversationRoom";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import type { JSONContent } from "@/modules/rich-text";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";
import { invalidateWorkspaceScheduledOutbox } from "../lib/invalidate-outbox-queries";
import { toScheduledMessageView } from "../lib/toScheduledMessageView";
import type { ScheduledMessageView } from "../types";

export function useScheduledMessagesSync(conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>) {
  const id = toReadonlyRef(conversationId);
  const queryClient = useQueryClient();
  const { user } = useAuthSession();

  const listQuery = useQuery({
    queryKey: computed(() => queryKeys.conversationScheduledMessages(id.value ?? "")),
    enabled: computed(() => id.value != null),
    queryFn: async () => {
      return apiClient.listScheduledMessages(id.value!);
    },
  });

  const schedules = computed((): readonly ScheduledMessageView[] => {
    const jobs = listQuery.data.value?.scheduledMessages ?? [];
    return jobs
      .filter((job) => !job.processed)
      .map((job) => toScheduledMessageView(job, user.value));
  });

  async function invalidateConversation() {
    if (!id.value) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.conversationScheduledMessages(id.value),
    });
  }

  async function invalidate() {
    await invalidateConversation();
  }

  async function invalidateAll(rootSpaceId?: SpaceId | null) {
    await invalidateConversation();
    await invalidateWorkspaceScheduledOutbox(queryClient, rootSpaceId);
  }

  function onScheduledUpserted(event: ScheduledMessageUpsertedEvent) {
    if (id.value && event.conversationId !== id.value) return;
    void invalidateAll(event.scheduledMessage.rootSpaceId);
  }

  function onScheduledCancelled(event: ScheduledMessageCancelledEvent) {
    if (id.value && event.conversationId !== id.value) return;
    void invalidateAll();
  }

  useConversationRoom(id);
  const { ensureSocket } = useRealtimeSocket();
  let cancelled = false;

  void ensureSocket().then((socket) => {
    if (cancelled) return;
    socket.on(SCHEDULED_MESSAGE_UPSERTED_EVENT, onScheduledUpserted);
    socket.on(SCHEDULED_MESSAGE_CANCELLED_EVENT, onScheduledCancelled);
  });

  onScopeDispose(() => {
    cancelled = true;
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    socket.off(SCHEDULED_MESSAGE_UPSERTED_EVENT, onScheduledUpserted);
    socket.off(SCHEDULED_MESSAGE_CANCELLED_EVENT, onScheduledCancelled);
  });

  const scheduleMutation = useMutation({
    mutationFn: async (input: {
      body: JSONContent;
      dueAt: string;
      recurrence?: "once" | "daily" | "weekly";
      weekdays?: number[];
      until?: string | null;
      threadId?: MessageId | null;
      attachmentIds?: AttachmentId[];
    }) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.scheduleMessage(id.value, {
        body: input.body,
        dueAt: input.dueAt,
        recurrence: input.recurrence ?? "once",
        weekdays: input.weekdays,
        until: input.until ?? undefined,
        threadId: input.threadId ?? null,
        attachmentIds: input.attachmentIds,
      });
    },
    onSuccess: (response) => invalidateAll(response.scheduledMessage.rootSpaceId),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      jobId: ScheduledJobId;
      dueAt?: string;
      recurrence?: "once" | "daily" | "weekly";
      weekdays?: number[];
      until?: string | null;
      body?: JSONContent;
      attachmentIds?: AttachmentId[];
    }) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.updateScheduledMessage(id.value, input.jobId, {
        dueAt: input.dueAt,
        recurrence: input.recurrence,
        weekdays: input.weekdays,
        until: input.until,
        body: input.body,
        attachmentIds: input.attachmentIds,
      });
    },
    onSuccess: (response) => invalidateAll(response.scheduledMessage.rootSpaceId),
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: ScheduledJobId) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.cancelScheduledMessage(id.value, jobId);
    },
    onSuccess: (response) => invalidateAll(response.scheduledMessage.rootSpaceId),
  });

  return {
    schedules,
    isLoading: computed(() => listQuery.isLoading.value),
    isFetching: computed(() => listQuery.isFetching.value),
    error: computed(() => listQuery.error.value),
    schedule: (input: {
      body: JSONContent;
      dueAt: string;
      recurrence?: "once" | "daily" | "weekly";
      weekdays?: number[];
      until?: string | null;
      threadId?: MessageId | null;
      attachmentIds?: AttachmentId[];
    }) => scheduleMutation.mutateAsync(input),
    update: (input: {
      jobId: ScheduledJobId;
      dueAt?: string;
      recurrence?: "once" | "daily" | "weekly";
      weekdays?: number[];
      until?: string | null;
      body?: JSONContent;
      attachmentIds?: AttachmentId[];
    }) => updateMutation.mutateAsync(input),
    cancel: (jobId: ScheduledJobId) => cancelMutation.mutateAsync(jobId),
    isScheduling: computed(() => scheduleMutation.isPending.value),
  };
}
