import type { DenserSocket } from "@denser/api-client";
import { createSharedComposable } from "@vueuse/core";
import { ref, shallowRef } from "vue";
import { apiClient } from "@/lib/api";

export const useRealtimeSocket = createSharedComposable(() => {
  const socket = shallowRef<DenserSocket | null>(null);
  const ready = ref(false);
  let connectPromise: Promise<DenserSocket> | null = null;

  async function ensureSocket(): Promise<DenserSocket> {
    if (socket.value?.connected) return socket.value;
    if (!connectPromise) {
      connectPromise = apiClient.connectRealtime().then((connected) => {
        socket.value = connected;
        ready.value = true;
        return connected;
      });
    }
    return connectPromise;
  }

  return { socket, ready, ensureSocket };
});
