import type { SpaceId } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";

export function useUnreadSummarySync(rootSpaceId: ReadonlyRefOrGetter<SpaceId | null | undefined>) {
  const rootId = toReadonlyRef(rootSpaceId);

  const query = useQuery({
    queryKey: computed(() => queryKeys.unreadSummary(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: async () => {
      const { conversations } = await apiClient.getUnreadSummary(rootId.value!);
      return conversations;
    },
  });

  const countsByConversationId = computed(() => {
    const map = new Map<string, number>();
    for (const row of query.data.value ?? []) {
      map.set(row.conversationId, row.unreadCount);
    }
    return map;
  });

  function unreadCountFor(conversationId: string): number {
    return countsByConversationId.value.get(conversationId) ?? 0;
  }

  return {
    unreadCountFor,
    reload: () => query.refetch(),
  };
}
