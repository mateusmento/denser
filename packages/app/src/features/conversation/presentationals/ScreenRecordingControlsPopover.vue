<script setup lang="ts">
import { Button, cn } from "@denser/design-system";
import { LayoutTemplateIcon, SquareIcon } from "@lucide/vue";
import { nextTick, onUnmounted, ref, watch } from "vue";
import {
  createDisplayCanvas,
  mountPreviewCanvas,
  startPreviewMirror,
} from "../lib/screen-recording-preview-mount";
import type { ScreenRecordingSetupView } from "../types";

const props = defineProps<{
  visible: boolean;
  view: ScreenRecordingSetupView;
  previewCanvas: HTMLCanvasElement | null;
}>();

const emit = defineEmits<{
  stop: [];
  openDialog: [];
}>();

const previewHost = ref<HTMLDivElement | null>(null);
let stopMirror: (() => void) | null = null;

function teardownMirror() {
  stopMirror?.();
  stopMirror = null;
}

watch(
  () => [props.visible, props.previewCanvas] as const,
  ([visible, sourceCanvas]) => {
    teardownMirror();
    if (!visible || !sourceCanvas) return;

    nextTick(() => {
      const host = previewHost.value;
      if (!host || !sourceCanvas) return;

      const displayCanvas = createDisplayCanvas("size-full object-cover");
      mountPreviewCanvas(host, displayCanvas, "size-full object-cover");
      stopMirror = startPreviewMirror(() => props.previewCanvas, displayCanvas);
    });
  },
  { flush: "post", immediate: true },
);

onUnmounted(() => {
  teardownMirror();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="
        cn(
          'fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl',
          'border border-border bg-popover p-2 pl-3 text-popover-foreground shadow-xl ring-1 ring-foreground/5',
        )
      "
      data-slot="screen-recording-controls-popover"
    >
      <div
        class="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-black"
        aria-hidden="true"
      >
        <div ref="previewHost" class="size-full" />
        <div
          class="pointer-events-none absolute start-1.5 top-1.5 flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-medium text-destructive-foreground"
        >
          <span class="size-1.5 animate-pulse rounded-full bg-white" />
          {{ view.elapsedLabel }}
        </div>
      </div>

      <div class="flex flex-col gap-1 pe-1">
        <p class="text-xs font-medium">
          {{ view.phase === "finalizing" ? "Finishing…" : "Recording" }}
        </p>
        <div class="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            :disabled="view.phase === 'finalizing'"
            @click="emit('openDialog')"
          >
            <LayoutTemplateIcon class="size-3.5" />
            Back to dialog
          </Button>
          <Button
            variant="destructive"
            size="sm"
            :disabled="view.phase === 'finalizing'"
            @click="emit('stop')"
          >
            <SquareIcon class="size-3.5 fill-current" />
            Stop
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
