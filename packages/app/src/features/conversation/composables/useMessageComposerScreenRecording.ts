import { toast } from "@denser/design-system";
import { computed, reactive, ref, watch } from "vue";
import type { CameraCircleLayout } from "../lib/screen-recording-composite";
import type { CameraResizeHandle } from "../lib/screen-recording-resize";
import {
  useScreenRecordingSetup,
  type ScreenRecordingViewer,
} from "./useScreenRecordingSetup";

export function useMessageComposerScreenRecording(options: {
  stageFiles: (files: readonly File[]) => void;
  disabled?: () => boolean;
  viewer?: () => ScreenRecordingViewer | null;
}) {
  const open = ref(false);
  const setup = useScreenRecordingSetup({ viewer: options.viewer });

  watch(open, (isOpen, wasOpen) => {
    if (!isOpen && wasOpen) {
      if (setup.phase.value === "recording" || setup.phase.value === "finalizing") return;
      setup.cancel();
    }
  });

  watch(
    () => setup.phase.value,
    (phase, previous) => {
      if (phase === "idle" && previous != null && previous !== "idle" && open.value) {
        open.value = false;
      }
    },
  );

  const controlsPopoverVisible = computed(
    () =>
      (setup.phase.value === "recording" || setup.phase.value === "finalizing") &&
      !open.value,
  );

  async function openDialog() {
    if (options.disabled?.()) return;
    if (setup.phase.value === "idle") {
      open.value = true;
      const started = await setup.begin();
      if (!started) {
        open.value = false;
        if (setup.view.value.error) toast(setup.view.value.error);
        return;
      }
      return;
    }
    open.value = true;
  }

  async function onCancel() {
    setup.cancel();
    open.value = false;
  }

  async function onStart() {
    await setup.startRecording();
    open.value = false;
  }

  async function onStop() {
    const file = await setup.stopRecording();
    open.value = false;
    if (!file || file.size === 0) {
      toast("Recording failed");
      return;
    }
    options.stageFiles([file]);
  }

  function onMoveCamera(payload: {
    displayX: number;
    displayY: number;
    displayWidth: number;
    displayHeight: number;
  }) {
    const { cameraLayout, frameWidth, frameHeight } = setup.view.value;
    const scale = Math.min(payload.displayWidth / frameWidth, payload.displayHeight / frameHeight);
    const contentWidth = frameWidth * scale;
    const contentHeight = frameHeight * scale;
    const offsetX = (payload.displayWidth - contentWidth) / 2;
    const offsetY = (payload.displayHeight - contentHeight) / 2;
    setup.setCameraLayout({
      x: (payload.displayX - offsetX) / scale,
      y: (payload.displayY - offsetY) / scale,
      diameter: cameraLayout.diameter,
    });
  }

  function onResizeCamera(payload: {
    handle: CameraResizeHandle;
    deltaCaptureX: number;
    deltaCaptureY: number;
    baseLayout?: CameraCircleLayout;
  }) {
    setup.resizeCamera(
      payload.handle,
      payload.deltaCaptureX,
      payload.deltaCaptureY,
      payload.baseLayout,
    );
  }

  function onMinimize() {
    open.value = false;
  }

  function onOpenDialogDuringRecording() {
    if (setup.phase.value === "recording") open.value = true;
  }

  return reactive({
    open,
    openDialog,
    onCancel,
    onStart,
    onStop,
    onMoveCamera,
    onResizeCamera,
    onMinimize,
    onOpenDialogDuringRecording,
    setWebcamEnabled: setup.setWebcamEnabled,
    setMicEnabled: setup.setMicEnabled,
    setSystemAudioEnabled: setup.setSystemAudioEnabled,
    setScreenEnabled: setup.setScreenEnabled,
    setMirrorCamera: setup.setMirrorCamera,
    setOverlayEditMode: setup.setOverlayEditMode,
    setWebcamDeviceId: setup.setWebcamDeviceId,
    setMicDeviceId: setup.setMicDeviceId,
    get setupView() {
      return setup.view.value;
    },
    get previewCanvas() {
      return setup.previewCanvas.value;
    },
    get controlsPopoverVisible() {
      return controlsPopoverVisible.value;
    },
  });
}
