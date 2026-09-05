import type { SpaceId, UserId } from "@denser/contracts";
import {
  WORKSPACE_PRESENCE_EVENT,
  WORKSPACE_PRESENCE_PULSE_EVENT,
  WORKSPACE_PRESENCE_SNAPSHOT_EVENT,
  WORKSPACE_PRESENCE_STOP_EVENT,
  WORKSPACE_PRESENCE_SUBSCRIBE_EVENT,
  WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT,
} from "@denser/contracts";
import type { WorkspacePresenceEvent, WorkspacePresenceSnapshotEvent } from "@denser/contracts";
import { useIntervalFn } from "@vueuse/core";
import { computed, onScopeDispose, ref, watch } from "vue";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";

const WORKSPACE_PULSE_MS = 30_000;

const onlineByRoot = ref(new Map<SpaceId, Set<UserId>>());
const subscriberCounts = new Map<SpaceId, number>();
let listenerAttached = false;

function readOnline(rootSpaceId: SpaceId): Set<UserId> {
  return onlineByRoot.value.get(rootSpaceId) ?? new Set();
}

function writeOnline(rootSpaceId: SpaceId, users: Set<UserId>) {
  const next = new Map(onlineByRoot.value);
  if (users.size === 0) next.delete(rootSpaceId);
  else next.set(rootSpaceId, users);
  onlineByRoot.value = next;
}

function onPresence(event: WorkspacePresenceEvent) {
  const users = new Set(readOnline(event.rootSpaceId));
  if (event.online) users.add(event.userId);
  else users.delete(event.userId);
  writeOnline(event.rootSpaceId, users);
}

function onPresenceSnapshot(event: WorkspacePresenceSnapshotEvent) {
  writeOnline(event.rootSpaceId, new Set(event.userIds));
}

async function ensureListener() {
  if (listenerAttached) return;
  const socket = await useRealtimeSocket().ensureSocket();
  socket.on(WORKSPACE_PRESENCE_EVENT, onPresence);
  socket.on(WORKSPACE_PRESENCE_SNAPSHOT_EVENT, onPresenceSnapshot);
  listenerAttached = true;
}

async function subscribeRoot(rootSpaceId: SpaceId) {
  await ensureListener();
  const socket = await useRealtimeSocket().ensureSocket();
  socket.emit(WORKSPACE_PRESENCE_SUBSCRIBE_EVENT, { rootSpaceId });
  socket.emit(WORKSPACE_PRESENCE_PULSE_EVENT, { rootSpaceId });
}

function unsubscribeRoot(rootSpaceId: SpaceId) {
  const socket = useRealtimeSocket().socket.value;
  if (!socket) return;
  socket.emit(WORKSPACE_PRESENCE_STOP_EVENT, { rootSpaceId });
  socket.emit(WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT, { rootSpaceId });
  writeOnline(rootSpaceId, new Set());
}

function addSubscriber(rootSpaceId: SpaceId) {
  const count = subscriberCounts.get(rootSpaceId) ?? 0;
  subscriberCounts.set(rootSpaceId, count + 1);
  if (count === 0) void subscribeRoot(rootSpaceId);
}

function removeSubscriber(rootSpaceId: SpaceId) {
  const count = subscriberCounts.get(rootSpaceId) ?? 0;
  if (count <= 1) {
    subscriberCounts.delete(rootSpaceId);
    unsubscribeRoot(rootSpaceId);
    return;
  }
  subscriberCounts.set(rootSpaceId, count - 1);
}

export function useWorkspacePresence(rootSpaceId: ReadonlyRefOrGetter<SpaceId | null | undefined>) {
  const rootId = toReadonlyRef(rootSpaceId);
  let activeRoot: SpaceId | null = null;

  const { pause, resume } = useIntervalFn(
    () => {
      if (!activeRoot) return;
      void useRealtimeSocket()
        .ensureSocket()
        .then((socket) => {
          socket.emit(WORKSPACE_PRESENCE_PULSE_EVENT, { rootSpaceId: activeRoot! });
        });
    },
    WORKSPACE_PULSE_MS,
    { immediate: false },
  );

  watch(
    rootId,
    (next, previous) => {
      if (previous) {
        removeSubscriber(previous);
        if (activeRoot === previous) activeRoot = null;
      }
      if (next) {
        addSubscriber(next);
        activeRoot = next;
        resume();
      } else {
        pause();
      }
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    pause();
    if (activeRoot) removeSubscriber(activeRoot);
  });

  const onlineUserIds = computed(() => {
    const root = rootId.value;
    if (!root) return new Set<UserId>();
    return readOnline(root);
  });

  return {
    onlineUserIds,
    isUserOnline: (userId: UserId) => onlineUserIds.value.has(userId),
  };
}
