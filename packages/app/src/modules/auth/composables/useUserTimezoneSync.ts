import { onMounted } from "vue";
import { useEventListener } from "@vueuse/core";
import { useQueryClient } from "@tanstack/vue-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthSession } from "./useAuthSession";

function detectedTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function useUserTimezoneSync(): void {
  const { user, isAuthenticated } = useAuthSession();
  const queryClient = useQueryClient();

  async function syncIfNeeded() {
    if (!isAuthenticated.value || !user.value) return;
    const detected = detectedTimezone();
    const source = user.value.timezoneSource ?? "auto";
    const stored = user.value.timezone;
    if (source === "manual") return;
    if (stored === detected) return;
    await apiClient.patchMe({ timezone: detected, timezoneSource: "auto" });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
  }

  onMounted(() => {
    void syncIfNeeded();
  });

  useEventListener(window, "focus", syncIfNeeded);
}
