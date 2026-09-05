<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "New",
  },
);
</script>

<template>
  <div
    class="relative flex items-center gap-3 px-3 py-2"
    role="separator"
    :aria-label="label"
    data-slot="conversation-unread-divider"
  >
    <div class="h-px min-w-0 flex-1 bg-destructive/70" aria-hidden="true" />
    <span class="shrink-0 text-xs font-semibold tracking-wide text-destructive uppercase">
      {{ label }}
    </span>
    <div class="h-px min-w-0 flex-1 bg-destructive/70" aria-hidden="true" />
  </div>
</template>
