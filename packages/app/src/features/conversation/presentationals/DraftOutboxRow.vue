<script setup lang="ts">
import type { DraftOutboxRowView } from "../types";
import { formatOutboxDestinationLine } from "../lib/outbox-preview";

defineProps<{
  item: DraftOutboxRowView;
}>();

const emit = defineEmits<{
  open: [id: string];
}>();
</script>

<template>
  <button
    type="button"
    class="flex w-full flex-col gap-0.5 rounded-xl border border-border/80 bg-card/40 px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent/40"
    data-slot="draft-outbox-row"
    @click="emit('open', item.id)"
  >
    <p class="truncate text-xs text-muted-foreground">
      {{ formatOutboxDestinationLine(item.conversationLabel, item.contextLabel) }}
    </p>
    <p class="line-clamp-2 text-sm text-foreground">{{ item.bodyPreview }}</p>
  </button>
</template>
