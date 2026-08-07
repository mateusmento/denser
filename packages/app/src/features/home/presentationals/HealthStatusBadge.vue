<script setup lang="ts">
import { Badge } from "@denser/design-system";

export type HealthStatus = "unknown" | "ok" | "error";

defineProps<{
  status: HealthStatus
}>();
</script>

<template>
  <Badge :variant="status === 'ok' ? 'default' : status === 'error' ? 'destructive' : 'secondary'">
    API {{ status }}
  </Badge>
</template>
