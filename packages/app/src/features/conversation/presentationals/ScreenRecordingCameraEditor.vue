<script setup lang="ts">
import { cn } from "@denser/design-system";
import { computed, onUnmounted, ref, useTemplateRef } from "vue";
import {
  cameraLayoutToDisplayRect,
  previewContentMetrics,
} from "../lib/screen-recording-display-metrics";
import type { CameraResizeHandle } from "../lib/screen-recording-resize";
import type { ScreenRecordingSetupView } from "../types";

const props = defineProps<{
  view: ScreenRecordingSetupView;
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
}>();

const host = useTemplateRef<HTMLDivElement>("host");

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

const metrics = computed(() => {
  const el = host.value;
  if (!el) return null;
  return previewContentMetrics(
    el.clientWidth,
    el.clientHeight,
    props.view.frameWidth,
    props.view.frameHeight,
  );
});

const showWebcamEditor = computed(
  () =>
    props.view.webcamEnabled &&
    props.view.webcamAvailable &&
    props.view.phase === "setup" &&
    metrics.value != null,
);

const bboxStyle = computed(() => {
  const m = metrics.value;
  if (!showWebcamEditor.value || !m) {
    return { display: "none" };
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

function capturePointer(event: PointerEvent) {
  host.value?.setPointerCapture(event.pointerId);
}

function onMovePointerDown(event: PointerEvent) {
  if (props.view.phase !== "setup") return;
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
  if (props.view.phase !== "setup") return;
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
  const displayX = event.clientX - el.getBoundingClientRect().left - dragOffset.value.x;
  const displayY = event.clientY - el.getBoundingClientRect().top - dragOffset.value.y;
  emit("moveCamera", {
    displayX,
    displayY,
    displayWidth: el.clientWidth,
    displayHeight: el.clientHeight,
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

onUnmounted(() => {
  dragging.value = false;
  resizing.value = null;
});

defineExpose({ host });
</script>

<template>
  <div
    ref="host"
    class="pointer-events-none absolute inset-0"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      v-if="showWebcamEditor"
      class="pointer-events-auto absolute touch-none border-2 border-dashed border-white/90"
      :style="bboxStyle"
      @pointerdown="onMovePointerDown"
    >
      <span
        v-for="handle in HANDLES"
        :key="handle.id"
        :class="
          cn(
            'absolute size-2 rounded-xs border border-white/90 bg-white shadow-sm',
            handle.class,
          )
        "
        @pointerdown="onResizePointerDown(handle.id, $event)"
      />
    </div>
  </div>
</template>
