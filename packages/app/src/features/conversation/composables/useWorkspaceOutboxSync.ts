import type { SpaceId } from "@denser/contracts";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { toDraftOutboxRowView, toScheduledOutboxRowView } from "../lib/toOutboxRowView";
import type { DraftOutboxRowView, ScheduledOutboxRowView } from "../types";

export function useWorkspaceOutboxSync(rootSpaceId: ReadonlyRefOrGetter<SpaceId | null | undefined>) {
  const rootId = toReadonlyRef(rootSpaceId);
  const queryClient = useQueryClient();

  const draftsQuery = useQuery({
    queryKey: computed(() => queryKeys.workspaceDrafts(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: () => apiClient.listWorkspaceDrafts(rootId.value!),
  });

  const draftCountQuery = useQuery({
    queryKey: computed(() => queryKeys.workspaceDraftCount(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: () => apiClient.countWorkspaceDrafts(rootId.value!),
  });

  const scheduledQuery = useQuery({
    queryKey: computed(() => queryKeys.workspaceScheduledMessages(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: () => apiClient.listWorkspaceScheduledMessages(rootId.value!),
  });

  const scheduledCountQuery = useQuery({
    queryKey: computed(() => queryKeys.workspaceScheduledCount(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: () => apiClient.countWorkspaceScheduledMessages(rootId.value!),
  });

  const drafts = computed((): readonly DraftOutboxRowView[] =>
    (draftsQuery.data.value?.drafts ?? []).map(toDraftOutboxRowView),
  );

  const scheduledMessages = computed((): readonly ScheduledOutboxRowView[] =>
    (scheduledQuery.data.value?.scheduledMessages ?? []).map(toScheduledOutboxRowView),
  );

  async function invalidate() {
    if (!rootId.value) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDrafts(rootId.value) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDraftCount(rootId.value) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceScheduledMessages(rootId.value),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceScheduledCount(rootId.value) }),
    ]);
  }

  return {
    drafts,
    scheduledMessages,
    draftCount: computed(() => draftCountQuery.data.value?.count ?? 0),
    scheduledCount: computed(() => scheduledCountQuery.data.value?.count ?? 0),
    isDraftsLoading: computed(() => draftsQuery.isLoading.value),
    isScheduledLoading: computed(() => scheduledQuery.isLoading.value),
    draftsError: computed(() => draftsQuery.error.value),
    scheduledError: computed(() => scheduledQuery.error.value),
    invalidate,
  };
}
