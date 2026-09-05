<script setup lang="ts">
import { cn } from "@denser/design-system";

defineProps<{
  online?: boolean;
  class?: string;
}>();
</script>

<template>
  <span
    v-if="online"
    :class="
      cn(
        'pointer-events-none absolute end-0 bottom-0 size-2 rounded-full border-2 border-sidebar bg-emerald-500',
        $props.class,
      )
    "
    aria-hidden="true"
    data-slot="presence-dot"
  />
</template>
