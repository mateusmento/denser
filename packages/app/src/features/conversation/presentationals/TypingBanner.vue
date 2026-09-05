<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <p
    class="flex items-center gap-2 px-2 pb-1 text-xs text-muted-foreground"
    data-slot="typing-banner"
    role="status"
    aria-live="polite"
  >
    <span class="relative flex size-2">
      <span
        class="absolute inline-flex size-full animate-ping rounded-full bg-muted-foreground/40"
        aria-hidden="true"
      />
      <span class="relative inline-flex size-2 rounded-full bg-muted-foreground/70" aria-hidden="true" />
    </span>
    {{ label }}
  </p>
</template>
