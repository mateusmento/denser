<script setup lang="ts">
import {
  Button,
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
import { nextTick, onUnmounted, useTemplateRef, watch } from "vue";
import type { CameraResizeHandle } from "../lib/screen-recording-resize";
import {
  createDisplayCanvas,
  mountPreviewCanvas,
  startPreviewMirror,
} from "../lib/screen-recording-preview-mount";
import ScreenRecordingCameraEditor from "./ScreenRecordingCameraEditor.vue";
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
  minimize: [];
  "update:webcamEnabled": [value: boolean];
  "update:micEnabled": [value: boolean];
  "update:systemAudioEnabled": [value: boolean];
  "move-camera": [payload: { displayX: number; displayY: number; displayWidth: number; displayHeight: number }];
  "resize-camera": [
    payload: {
      handle: CameraResizeHandle;
      deltaCaptureX: number;
      deltaCaptureY: number;
      baseLayout: ScreenRecordingSetupView["cameraLayout"];
    },
  ];
}>();

const previewHost = useTemplateRef<HTMLDivElement>("previewHost");
let stopMirror: (() => void) | null = null;

function teardownMirror() {
  stopMirror?.();
  stopMirror = null;
}

watch(
  () => [open.value, props.previewCanvas, props.view.phase] as const,
  ([isOpen, canvas, phase]) => {
    teardownMirror();
    if (!isOpen || !canvas) return;

    nextTick(() => {
      const host = previewHost.value;
      if (!host || !canvas) return;

      if (phase === "setup") {
        mountPreviewCanvas(host, canvas, "size-full object-contain");
        return;
      }

      if (phase === "recording" || phase === "finalizing") {
        const displayCanvas = createDisplayCanvas("size-full object-contain");
        mountPreviewCanvas(host, displayCanvas, "size-full object-contain");
        stopMirror = startPreviewMirror(() => props.previewCanvas, displayCanvas);
      }
    });
  },
  { flush: "post", immediate: true },
);

onUnmounted(() => {
  teardownMirror();
});

function onInteractOutside(event: Event) {
  if (props.view.phase === "recording" || props.view.phase === "finalizing") {
    event.preventDefault();
  }
}

function onEscapeKeydown(event: KeyboardEvent) {
  if (props.view.phase === "recording" || props.view.phase === "finalizing") {
    event.preventDefault();
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[min(40rem,calc(100vh-2rem))] max-w-3xl flex-col gap-4 sm:max-w-3xl"
      data-slot="screen-recording-setup-dialog"
      :show-close-button="view.phase !== 'recording' && view.phase !== 'finalizing'"
      @pointer-down-outside="onInteractOutside"
      @interact-outside="onInteractOutside"
      @escape-key-down="onEscapeKeydown"
    >
      <DialogHeader>
        <DialogTitle>Record screen</DialogTitle>
        <DialogDescription>
          <template v-if="view.phase === 'recording'">
            Recording in progress. Minimize to use the floating controls while you present.
          </template>
          <template v-else>
            Position and resize your camera, then record. The preview matches the exported video.
          </template>
        </DialogDescription>
      </DialogHeader>

      <p v-if="view.error" class="text-sm text-destructive">{{ view.error }}</p>

      <div
        class="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        :style="{ aspectRatio: String(view.previewAspectRatio) }"
      >
        <div ref="previewHost" class="relative flex size-full items-center justify-center bg-black/80" />

        <ScreenRecordingCameraEditor
          :view="view"
          @move-camera="emit('move-camera', $event)"
          @resize-camera="emit('resize-camera', $event)"
        />

        <div
          v-if="view.phase === 'finalizing'"
          class="absolute inset-0 flex items-center justify-center bg-background/60"
        >
          <Spinner class="size-8" />
          <span class="sr-only">Processing</span>
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
        <Button
          v-if="view.phase !== 'recording'"
          variant="ghost"
          @click="emit('cancel')"
        >
          Cancel
        </Button>
        <div v-else />

        <div class="flex gap-2">
          <Button
            v-if="view.phase === 'setup'"
            :disabled="!view.canStart"
            @click="emit('start')"
          >
            Start recording
          </Button>
          <template v-else-if="view.phase === 'recording'">
            <Button variant="outline" @click="emit('minimize')">Minimize</Button>
            <Button variant="destructive" @click="emit('stop')">Stop</Button>
          </template>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
