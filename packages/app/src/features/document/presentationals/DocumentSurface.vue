<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col p-3" data-slot="document-surface">
    <div v-if="$slots.header" class="flex h-surface-header shrink-0 items-center">
      <slot name="header" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
