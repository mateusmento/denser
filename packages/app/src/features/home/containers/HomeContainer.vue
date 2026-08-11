<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "@denser/design-system";
import { apiClient } from "@/lib/api";
import HealthStatusBadge, {
  type HealthStatus,
} from "@/features/home/presentationals/HealthStatusBadge.vue";

const status = ref<HealthStatus>("unknown");

async function checkHealth() {
  try {
    await apiClient.health();
    status.value = "ok";
  } catch {
    status.value = "error";
  }
}

onMounted(() => {
  checkHealth().catch(() => {
    status.value = "error";
  });
});
</script>

<template>
  <main class="min-h-screen space-y-4 bg-background p-8 text-foreground">
    <h1 class="text-2xl font-semibold tracking-tight">Denser</h1>
    <p class="text-sm text-muted-foreground">Full-stack skeleton — health check via api-client.</p>
    <div class="flex items-center gap-3">
      <HealthStatusBadge :status="status" />
      <Button type="button" @click="checkHealth">Recheck</Button>
    </div>
  </main>
</template>
