import type { ArtifactId } from "@denser/contracts";
import { onMounted, onUnmounted, watch } from "vue";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { joinConversationRoom, leaveConversationRoom } from "./conversation-room";
import { useRealtimeSocket } from "./useRealtimeSocket";

export function useConversationRoom(conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>) {
  const id = toReadonlyRef(conversationId);
  const { ensureSocket } = useRealtimeSocket();
  let cancelled = false;

  async function join(conversation: ArtifactId) {
    const socket = await ensureSocket();
    if (cancelled) return;
    joinConversationRoom(socket, conversation);
  }

  function leave(conversation: ArtifactId) {
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    leaveConversationRoom(socket, conversation);
  }

  onMounted(() => {
    if (id.value) void join(id.value);
  });

  watch(id, (next, previous) => {
    if (previous) leave(previous);
    if (next) void join(next);
  });

  onUnmounted(() => {
    cancelled = true;
    if (id.value) leave(id.value);
  });
}
