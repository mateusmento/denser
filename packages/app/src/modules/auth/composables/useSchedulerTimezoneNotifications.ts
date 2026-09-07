import {
  SCHEDULER_TIMEZONE_CHANGED_EVENT,
  type SchedulerTimezoneChangedEvent,
} from "@denser/contracts";
import { toast } from "@denser/design-system";
import { onScopeDispose, watch } from "vue";
import { useRouter } from "vue-router";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { useAuthSession } from "./useAuthSession";

function formatSchedulerTimezoneChangedMessage(payload: SchedulerTimezoneChangedEvent): string {
  return `Timezone for ${payload.spaceTitle} changed; your scheduled messages were adjusted.`;
}

export function useSchedulerTimezoneNotifications(): void {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const { ensureSocket } = useRealtimeSocket();
  let cancelled = false;
  let attached = false;

  function onTimezoneChanged(payload: SchedulerTimezoneChangedEvent) {
    toast(formatSchedulerTimezoneChangedMessage(payload), {
      action: {
        label: "View scheduled messages",
        onClick: () => {
          router.push({ name: "workspace-scheduled" }).catch(() => {});
        },
      },
    });
  }

  async function attach() {
    if (cancelled || attached || !isAuthenticated.value) return;
    const socket = await ensureSocket();
    if (cancelled) return;
    socket.on(SCHEDULER_TIMEZONE_CHANGED_EVENT, onTimezoneChanged);
    attached = true;
  }

  watch(
    isAuthenticated,
    (authed) => {
      if (authed) void attach();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    cancelled = true;
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    socket.off(SCHEDULER_TIMEZONE_CHANGED_EVENT, onTimezoneChanged);
  });
}
