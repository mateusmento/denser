<script setup lang="ts">
import { cn } from "@denser/design-system";
import { CheckIcon, SquarePenIcon } from "@lucide/vue";
import { useElementSize } from "@vueuse/core";
import { computed, onUnmounted, ref, useTemplateRef } from "vue";
import {
  cameraLayoutToDisplayRect,
  previewContentMetrics,
} from "../lib/screen-recording-display-metrics";
import {
  shouldShowOverlayEditButton,
  shouldShowWebcamEditor,
} from "../lib/screen-recording-overlay-visibility";
import type { CameraResizeHandle } from "../lib/screen-recording-resize";
import type { ScreenRecordingSetupView } from "../types";

const props = defineProps<{
  view: ScreenRecordingSetupView;
  previewCanvas: HTMLCanvasElement | null;
}>();

const emit = defineEmits<{
  moveCamera: [payload: { displayX: number; displayY: number; displayWidth: number; displayHeight: number }];
  resizeCamera: [
    payload: {
      handle: CameraResizeHandle;
      deltaCaptureX: number;
      deltaCaptureY: number;
      baseLayout: ScreenRecordingSetupView["cameraLayout"];
    },
  ];
  "update:overlayEditMode": [value: boolean];
}>();

const host = useTemplateRef<HTMLDivElement>("host");
const { width: hostWidth, height: hostHeight } = useElementSize(host);
const { width: canvasWidth, height: canvasHeight } = useElementSize(
  () => props.previewCanvas ?? undefined,
);
const overlayHovered = ref(false);

const metrics = computed(() => {
  const displayWidth = canvasWidth.value || hostWidth.value;
  const displayHeight = canvasHeight.value || hostHeight.value;
  if (!displayWidth || !displayHeight) return null;
  return previewContentMetrics(
    displayWidth,
    displayHeight,
    props.view.frameWidth,
    props.view.frameHeight,
  );
});

const showWebcamEditor = computed(() =>
  shouldShowWebcamEditor(props.view, metrics.value != null),
);

const showEditButton = computed(() =>
  shouldShowOverlayEditButton(props.view, metrics.value != null),
);

const HANDLES: readonly { id: CameraResizeHandle; class: string }[] = [
  { id: "nw", class: "-start-1 -top-1 cursor-nwse-resize" },
  { id: "n", class: "start-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
  { id: "ne", class: "-end-1 -top-1 cursor-nesw-resize" },
  { id: "e", class: "end-0 top-1/2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize" },
  { id: "se", class: "-end-1 -bottom-1 cursor-nwse-resize" },
  { id: "s", class: "start-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
  { id: "sw", class: "-start-1 -bottom-1 cursor-nesw-resize" },
  { id: "w", class: "start-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
];

const bboxStyle = computed(() => {
  const m = metrics.value;
  if (!m) {
    return undefined;
  }
  const rect = cameraLayoutToDisplayRect(m, props.view.cameraLayout);
  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.size}px`,
    height: `${rect.size}px`,
  };
});

const dragging = ref(false);
const resizing = ref<CameraResizeHandle | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const resizeStart = ref({ x: 0, y: 0 });
const resizeBaseLayout = ref(props.view.cameraLayout);

const overlayToggleClass =
  "absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/15";

function displayDimensions() {
  const el = host.value;
  return {
    width: canvasWidth.value || hostWidth.value || el?.clientWidth || 0,
    height: canvasHeight.value || hostHeight.value || el?.clientHeight || 0,
  };
}

function capturePointer(event: PointerEvent) {
  host.value?.setPointerCapture(event.pointerId);
}

function onMovePointerDown(event: PointerEvent) {
  if (props.view.phase !== "setup" || !props.view.overlayEditMode) return;
  if (event.target instanceof Element && event.target.closest("button")) return;
  event.preventDefault();
  capturePointer(event);
  dragging.value = true;
  const el = host.value;
  if (!el || !metrics.value) return;
  const rect = cameraLayoutToDisplayRect(metrics.value, props.view.cameraLayout);
  dragOffset.value = {
    x: event.clientX - el.getBoundingClientRect().left - rect.left,
    y: event.clientY - el.getBoundingClientRect().top - rect.top,
  };
}

function onResizePointerDown(handle: CameraResizeHandle, event: PointerEvent) {
  if (props.view.phase !== "setup" || !props.view.overlayEditMode) return;
  event.stopPropagation();
  event.preventDefault();
  capturePointer(event);
  resizing.value = handle;
  resizeStart.value = { x: event.clientX, y: event.clientY };
  resizeBaseLayout.value = props.view.cameraLayout;
}

function onPointerMove(event: PointerEvent) {
  const el = host.value;
  if (!el || !metrics.value) return;

  if (resizing.value) {
    const scale = metrics.value.scale;
    const totalDeltaX = (event.clientX - resizeStart.value.x) / scale;
    const totalDeltaY = (event.clientY - resizeStart.value.y) / scale;
    emit("resizeCamera", {
      handle: resizing.value,
      deltaCaptureX: totalDeltaX,
      deltaCaptureY: totalDeltaY,
      baseLayout: resizeBaseLayout.value,
    });
    return;
  }

  if (!dragging.value) return;
  const { width, height } = displayDimensions();
  const displayX = event.clientX - el.getBoundingClientRect().left - dragOffset.value.x;
  const displayY = event.clientY - el.getBoundingClientRect().top - dragOffset.value.y;
  emit("moveCamera", {
    displayX,
    displayY,
    displayWidth: width,
    displayHeight: height,
  });
}

function onPointerUp(event: PointerEvent) {
  dragging.value = false;
  resizing.value = null;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }
}

function onEditClick(event: MouseEvent) {
  event.stopPropagation();
  overlayHovered.value = false;
  emit("update:overlayEditMode", true);
}

function onConfirmClick(event: MouseEvent) {
  event.stopPropagation();
  overlayHovered.value = false;
  emit("update:overlayEditMode", false);
}

onUnmounted(() => {
  dragging.value = false;
  resizing.value = null;
});

defineExpose({ host });
</script>

<template>
  <div
    ref="host"
    class="pointer-events-none absolute inset-0 z-30"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      v-if="showEditButton"
      data-slot="screen-recording-camera-editor-hover"
      class="pointer-events-auto absolute touch-none rounded-full"
      :style="bboxStyle"
      @mouseenter="overlayHovered = true"
      @mouseleave="overlayHovered = false"
    >
      <button
        v-if="overlayHovered"
        type="button"
        data-slot="screen-recording-overlay-toggle"
        :class="overlayToggleClass"
        aria-label="Edit camera overlay"
        @click.stop="onEditClick"
        @pointerdown.stop
      >
        <SquarePenIcon class="size-4" />
      </button>
    </div>

    <div
      v-if="showWebcamEditor"
      data-slot="screen-recording-camera-editor-bbox"
      class="pointer-events-auto absolute touch-none border-2 border-dashed border-primary"
      :style="bboxStyle"
      @mouseenter="overlayHovered = true"
      @mouseleave="overlayHovered = false"
      @pointerdown="onMovePointerDown"
    >
      <button
        v-if="overlayHovered"
        type="button"
        data-slot="screen-recording-overlay-toggle"
        :class="overlayToggleClass"
        aria-label="Confirm camera overlay"
        @click.stop="onConfirmClick"
        @pointerdown.stop
      >
        <CheckIcon class="size-4" />
      </button>

      <span
        v-for="handle in HANDLES"
        :key="handle.id"
        :class="
          cn(
            'absolute size-2 rounded-xs border border-primary bg-white shadow-sm',
            handle.class,
          )
        "
        @pointerdown="onResizePointerDown(handle.id, $event)"
      />
    </div>
  </div>
</template>
