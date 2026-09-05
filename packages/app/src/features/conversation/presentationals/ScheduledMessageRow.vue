<script setup lang="ts">
import type { ConversationScheduledMessageView } from "../types";

defineProps<{
  item: ConversationScheduledMessageView;
}>();
</script>

<template>
  <article class="flex flex-col gap-0.5 rounded-md border border-border/60 px-3 py-2">
    <p class="text-sm text-foreground">{{ item.bodyPreview }}</p>
    <p class="text-xs text-muted-foreground">
      {{ item.nextRunWallTimeLabel }}
      <span v-if="item.recurrenceLabel !== 'Once'"> · {{ item.recurrenceLabel }}</span>
    </p>
  </article>
</template>
