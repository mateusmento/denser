<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    peaks: readonly number[];
    progress: number;
    disabled?: boolean;
    ariaLabel: string;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  seek: [progress: number];
}>();

const isDragging = ref(false);

const bars = computed(() =>
  props.peaks.length > 0 ? props.peaks : Array.from({ length: 48 }, () => 0.2),
);

function progressFromPointer(clientX: number, element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return;
  const element = event.currentTarget as HTMLElement;
  isDragging.value = true;
  element.setPointerCapture(event.pointerId);
  emit("seek", progressFromPointer(event.clientX, element));
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value || props.disabled) return;
  const element = event.currentTarget as HTMLElement;
  emit("seek", progressFromPointer(event.clientX, element));
}

function onPointerUp(event: PointerEvent) {
  if (!isDragging.value) return;
  isDragging.value = false;
  const element = event.currentTarget as HTMLElement;
  element.releasePointerCapture(event.pointerId);
}

function onKeyDown(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    emit("seek", Math.max(0, props.progress - 0.05));
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    emit("seek", Math.min(1, props.progress + 0.05));
  } else if (event.key === "Home") {
    event.preventDefault();
    emit("seek", 0);
  } else if (event.key === "End") {
    event.preventDefault();
    emit("seek", 1);
  }
}
</script>

<template>
  <div
    data-slot="audio-waveform"
    role="slider"
    tabindex="0"
    class="flex h-6 min-w-0 flex-1 cursor-pointer items-end gap-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    :aria-label="ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="Math.round(progress * 100)"
    :aria-disabled="disabled || undefined"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeyDown"
  >
    <span
      v-for="(peak, index) in bars"
      :key="index"
      class="w-0.5 rounded-full transition-colors"
      :class="
        index / bars.length <= progress
          ? 'bg-primary'
          : 'bg-muted-foreground/35'
      "
      :style="{ height: `${Math.round(6 + peak * 14)}px` }"
      aria-hidden="true"
    />
  </div>
</template>
