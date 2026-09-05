<script setup lang="ts">
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
  Switch,
} from "@denser/design-system";
import { computed, onUnmounted, ref, useTemplateRef, watch } from "vue";
import type { ScreenRecordingSetupView } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  view: ScreenRecordingSetupView;
  previewCanvas: HTMLCanvasElement | null;
}>();

const emit = defineEmits<{
  cancel: [];
  start: [];
  stop: [];
  "update:webcamEnabled": [value: boolean];
  "update:micEnabled": [value: boolean];
  "update:systemAudioEnabled": [value: boolean];
  "move-camera": [payload: { displayX: number; displayY: number; displayWidth: number; displayHeight: number }];
}>();

const previewHost = useTemplateRef<HTMLDivElement>("previewHost");
const dragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

watch(
  () => props.previewCanvas,
  (canvas) => {
    const host = previewHost.value;
    if (!host) return;
    host.replaceChildren();
    if (canvas) {
      canvas.className = "size-full object-contain";
      canvas.setAttribute("data-screen-recording-preview", "");
      host.appendChild(canvas);
    }
  },
  { flush: "post" },
);

const overlayStyle = computed(() => {
  const host = previewHost.value;
  const { cameraLayout, frameWidth, frameHeight } = props.view;
  if (!host || !frameWidth || !frameHeight) return { display: "none" };
  const rect = host.getBoundingClientRect();
  const displayWidth = host.clientWidth;
  const displayHeight = host.clientHeight;
  if (!displayWidth || !displayHeight) return { display: "none" };

  const scale = Math.min(displayWidth / frameWidth, displayHeight / frameHeight);
  const contentWidth = frameWidth * scale;
  const contentHeight = frameHeight * scale;
  const offsetX = (displayWidth - contentWidth) / 2;
  const offsetY = (displayHeight - contentHeight) / 2;

  const left = offsetX + cameraLayout.x * scale;
  const top = offsetY + cameraLayout.y * scale;
  const size = cameraLayout.diameter * scale;

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
});

const showCameraHandle = computed(
  () =>
    props.view.webcamEnabled &&
    (props.view.phase === "setup" || props.view.phase === "recording"),
);

function onPointerDown(event: PointerEvent) {
  if (!showCameraHandle.value || props.view.phase === "recording") return;
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  dragging.value = true;
  const host = previewHost.value;
  if (!host) return;
  const rect = host.getBoundingClientRect();
  const layout = props.view.cameraLayout;
  const scale = Math.min(host.clientWidth / props.view.frameWidth, host.clientHeight / props.view.frameHeight);
  const offsetX = (host.clientWidth - props.view.frameWidth * scale) / 2;
  const offsetY = (host.clientHeight - props.view.frameHeight * scale) / 2;
  const circleLeft = offsetX + layout.x * scale;
  const circleTop = offsetY + layout.y * scale;
  dragOffset.value = {
    x: event.clientX - rect.left - circleLeft,
    y: event.clientY - rect.top - circleTop,
  };
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  const host = previewHost.value;
  if (!host) return;
  const displayX = event.clientX - host.getBoundingClientRect().left - dragOffset.value.x;
  const displayY = event.clientY - host.getBoundingClientRect().top - dragOffset.value.y;
  emit("move-camera", {
    displayX,
    displayY,
    displayWidth: host.clientWidth,
    displayHeight: host.clientHeight,
  });
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  const target = event.currentTarget as HTMLElement;
  target.releasePointerCapture(event.pointerId);
}

onUnmounted(() => {
  dragging.value = false;
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[min(40rem,calc(100vh-2rem))] max-w-3xl flex-col gap-4 sm:max-w-3xl"
      data-slot="screen-recording-setup-dialog"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <DialogHeader>
        <DialogTitle>Record screen</DialogTitle>
        <DialogDescription>
          Position your camera, then record. The preview matches the exported video.
        </DialogDescription>
      </DialogHeader>

      <p v-if="view.error" class="text-sm text-destructive">{{ view.error }}</p>

      <div
        class="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        :style="{ aspectRatio: String(view.previewAspectRatio) }"
      >
        <div ref="previewHost" class="relative flex size-full items-center justify-center bg-black/80" />

        <div
          v-if="showCameraHandle"
          class="absolute touch-none rounded-full border-2 border-white/70 shadow-lg"
          :class="cn(view.phase === 'setup' && 'cursor-grab active:cursor-grabbing')"
          :style="overlayStyle"
          @pointerdown="onPointerDown"
        />

        <div
          v-if="view.phase === 'acquiring' || view.phase === 'finalizing'"
          class="absolute inset-0 flex items-center justify-center bg-background/60"
        >
          <Spinner class="size-8" />
          <span class="sr-only">{{ view.phase === "finalizing" ? "Processing" : "Starting" }}</span>
        </div>

        <div
          v-if="view.phase === 'recording'"
          class="absolute start-3 top-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground"
        >
          <span class="size-2 animate-pulse rounded-full bg-white" />
          {{ view.elapsedLabel }}
        </div>
      </div>

      <div
        v-if="view.phase === 'setup'"
        class="grid gap-3 sm:grid-cols-3"
      >
        <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
          <Label for="sr-webcam">Webcam</Label>
          <Switch
            id="sr-webcam"
            :checked="view.webcamEnabled"
            @update:checked="emit('update:webcamEnabled', $event)"
          />
        </div>
        <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
          <Label for="sr-mic">Microphone</Label>
          <Switch
            id="sr-mic"
            :checked="view.micEnabled"
            @update:checked="emit('update:micEnabled', $event)"
          />
        </div>
        <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
          <Label for="sr-system">System audio</Label>
          <Switch
            id="sr-system"
            :checked="view.systemAudioEnabled"
            @update:checked="emit('update:systemAudioEnabled', $event)"
          />
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-between">
        <Button variant="ghost" @click="emit('cancel')">Cancel</Button>
        <div class="flex gap-2">
          <Button
            v-if="view.phase === 'setup'"
            :disabled="!view.canStart"
            @click="emit('start')"
          >
            Start recording
          </Button>
          <Button
            v-else-if="view.phase === 'recording'"
            variant="destructive"
            @click="emit('stop')"
          >
            Stop
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
