<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { provideAuthSession } from "../composables/useAuthSession";

const sessionQuery = useQuery({
  queryKey: queryKeys.session(),
  queryFn: () => apiClient.session(),
  retry: false,
  staleTime: 60_000,
});

const user = computed(() => sessionQuery.data.value?.user ?? null);
const isAuthenticated = computed(() => user.value?.id != null);
const isLoading = computed(() => sessionQuery.isLoading.value);

provideAuthSession({ user, isAuthenticated, isLoading });
</script>

<template>
  <slot />
</template>
