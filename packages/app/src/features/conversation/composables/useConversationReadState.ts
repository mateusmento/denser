import type { ArtifactId, MessageId, SpaceId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";

export function useConversationReadState(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options?: {
    rootSpaceId?: ReadonlyRefOrGetter<SpaceId | null | undefined>;
  },
) {
  const id = toReadonlyRef(conversationId);
  const rootSpaceId = toReadonlyRef(options?.rootSpaceId ?? (() => undefined));
  const queryClient = useQueryClient();
  const sessionDividerId = ref<MessageId | null>(null);

  const unreadQuery = useQuery({
    queryKey: computed(() => queryKeys.conversationUnread(id.value ?? "")),
    enabled: computed(() => id.value != null),
    queryFn: async () => {
      const { summary } = await apiClient.getConversationUnread(id.value!);
      return summary;
    },
  });

  const openAnchor = computed((): MessageId | null | undefined => {
    if (!id.value) return undefined;
    if (unreadQuery.isPending.value) return undefined;
    if (unreadQuery.isError.value) return null;
    return unreadQuery.data.value?.firstUnreadMessageId ?? null;
  });

  watch(id, () => {
    sessionDividerId.value = null;
  });

  watch(
    () => unreadQuery.data.value?.firstUnreadMessageId,
    (firstUnreadMessageId) => {
      if (firstUnreadMessageId) {
        sessionDividerId.value = firstUnreadMessageId;
      }
    },
  );

  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!id.value) return null;
      return apiClient.markConversationRead(id.value);
    },
    onSuccess: async () => {
      if (!id.value) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversationUnread(id.value),
      });
      const rootId = rootSpaceId.value;
      if (rootId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.unreadSummary(rootId) });
      }
    },
  });

  const scheduleMarkRead = useDebounceFn(() => {
    if (!id.value || markReadMutation.isPending.value) return;
    void markReadMutation.mutate();
  }, 400);

  watch(
    () => [id.value, unreadQuery.isSuccess.value] as const,
    ([conversationId, ready]) => {
      if (!conversationId || !ready) return;
      scheduleMarkRead();
    },
    { immediate: true },
  );

  function clearDivider() {
    sessionDividerId.value = null;
  }

  return {
    unreadCount: computed(() => unreadQuery.data.value?.unreadCount ?? 0),
    openAnchor,
    sessionDividerId: sessionDividerId as Readonly<Ref<MessageId | null>>,
    clearDivider,
  };
}
