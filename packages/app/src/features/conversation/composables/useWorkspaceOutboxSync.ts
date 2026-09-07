import type { SpaceId } from "@denser/contracts";
import {
  SCHEDULED_MESSAGE_CANCELLED_EVENT,
  SCHEDULED_MESSAGE_UPSERTED_EVENT,
  type ScheduledMessageCancelledEvent,
  type ScheduledMessageUpsertedEvent,
} from "@denser/contracts";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, onScopeDispose } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import {
  invalidateWorkspaceDraftOutbox,
  invalidateWorkspaceScheduledOutbox,
} from "../lib/invalidate-outbox-queries";
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

  const scheduledItems = computed(
    () => scheduledQuery.data.value?.scheduledMessages ?? [],
  );

  const scheduledMessages = computed((): readonly ScheduledOutboxRowView[] =>
    scheduledItems.value.map(toScheduledOutboxRowView),
  );

  async function invalidate() {
    if (!rootId.value) return;
    await Promise.all([
      invalidateWorkspaceDraftOutbox(queryClient, rootId.value),
      invalidateWorkspaceScheduledOutbox(queryClient, rootId.value),
    ]);
  }

  function onScheduledUpserted(event: ScheduledMessageUpsertedEvent) {
    const rootSpaceId = event.scheduledMessage.rootSpaceId;
    if (rootId.value && rootSpaceId !== rootId.value) return;
    void invalidateWorkspaceScheduledOutbox(queryClient, rootSpaceId);
  }

  function onScheduledCancelled(event: ScheduledMessageCancelledEvent) {
    void invalidateWorkspaceScheduledOutbox(queryClient, rootId.value);
  }

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

  return {
    drafts,
    scheduledItems,
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
