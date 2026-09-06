import type { ArtifactId, AttachmentId, MessageId, ScheduledJobId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import type { JSONContent } from "@/modules/rich-text";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";
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

  async function invalidate() {
    if (!id.value) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.conversationScheduledMessages(id.value),
    });
  }

  const scheduleMutation = useMutation({
    mutationFn: async (input: {
      body: JSONContent;
      dueAt: string;
      threadId?: MessageId | null;
      attachmentIds?: AttachmentId[];
    }) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.scheduleMessage(id.value, {
        body: input.body,
        dueAt: input.dueAt,
        threadId: input.threadId ?? null,
        attachmentIds: input.attachmentIds,
      });
    },
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      jobId: ScheduledJobId;
      dueAt?: string;
      body?: JSONContent;
      attachmentIds?: AttachmentId[];
    }) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.updateScheduledMessage(id.value, input.jobId, {
        dueAt: input.dueAt,
        body: input.body,
        attachmentIds: input.attachmentIds,
      });
    },
    onSuccess: () => invalidate(),
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: ScheduledJobId) => {
      if (!id.value) throw new Error("missing conversation");
      return apiClient.cancelScheduledMessage(id.value, jobId);
    },
    onSuccess: () => invalidate(),
  });

  return {
    schedules,
    isLoading: computed(() => listQuery.isLoading.value),
    isFetching: computed(() => listQuery.isFetching.value),
    error: computed(() => listQuery.error.value),
    schedule: (input: {
      body: JSONContent;
      dueAt: string;
      threadId?: MessageId | null;
      attachmentIds?: AttachmentId[];
    }) => scheduleMutation.mutateAsync(input),
    update: (input: {
      jobId: ScheduledJobId;
      dueAt?: string;
      body?: JSONContent;
      attachmentIds?: AttachmentId[];
    }) => updateMutation.mutateAsync(input),
    cancel: (jobId: ScheduledJobId) => cancelMutation.mutateAsync(jobId),
    isScheduling: computed(() => scheduleMutation.isPending.value),
  };
}
