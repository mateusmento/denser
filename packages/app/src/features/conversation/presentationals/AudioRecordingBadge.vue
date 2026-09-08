<script setup lang="ts">
import { Button } from "@denser/design-system";
import type { AudioRecordingBadgeView } from "../types";

defineProps<{
  view: AudioRecordingBadgeView;
}>();

const emit = defineEmits<{
  stop: [];
}>();
</script>

<template>
  <div
    data-slot="audio-recording-badge"
    class="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <div class="flex h-6 items-end gap-0.5" aria-hidden="true">
        <span
          v-for="index in 12"
          :key="index"
          class="w-0.5 rounded-full bg-primary/70 animate-pulse"
          :style="{
            height: `${8 + ((index * 7) % 16)}px`,
            animationDelay: `${index * 70}ms`,
          }"
        />
      </div>
      <span class="shrink-0 text-sm tabular-nums text-muted-foreground">{{ view.elapsedLabel }}</span>
    </div>
    <Button size="sm" variant="secondary" :disabled="view.phase === 'finalizing'" @click="emit('stop')">
      Stop
    </Button>
  </div>
</template>
