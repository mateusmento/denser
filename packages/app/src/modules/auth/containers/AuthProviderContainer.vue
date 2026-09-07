<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { provideAuthSession } from "../composables/useAuthSession";
import { useUserTimezoneSync } from "../composables/useUserTimezoneSync";
import { useSchedulerTimezoneNotifications } from "../composables/useSchedulerTimezoneNotifications";

const sessionQuery = useQuery({
  queryKey: queryKeys.session(),
  queryFn: async () => {
    const session = await apiClient.session();
    if (!session.user?.id) return session;
    const me = await apiClient.me();
    return {
      user: {
        ...session.user,
        timezone: me.user.timezone ?? null,
        timezoneSource: me.user.timezoneSource ?? "auto",
      },
    };
  },
  retry: false,
  staleTime: 60_000,
});

const user = computed(() => sessionQuery.data.value?.user ?? null);
const isAuthenticated = computed(() => user.value?.id != null);
const isLoading = computed(() => sessionQuery.isLoading.value);

provideAuthSession({ user, isAuthenticated, isLoading });
useUserTimezoneSync();
useSchedulerTimezoneNotifications();
</script>

<template>
  <slot />
</template>
