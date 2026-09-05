import { computed, onScopeDispose, ref, shallowRef } from "vue";
import {
  clampCameraLayout,
  defaultCameraLayout,
  displayPointToCapture,
  type CameraCircleLayout,
} from "../lib/screen-recording-composite";
import {
  acquireScreenRecordingStreams,
  createPreviewCompositor,
  releaseAcquiredStreams,
  startCanvasRecording,
  type AcquiredStreams,
  type ActiveRecording,
  type ScreenRecordingToggles,
} from "../lib/screen-recording-capture";
import type { ScreenRecordingPhase, ScreenRecordingSetupView } from "../types";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useScreenRecordingSetup() {
  const phase = ref<ScreenRecordingPhase | "idle">("idle");
  const error = ref<string | undefined>();
  const webcamEnabled = ref(true);
  const micEnabled = ref(true);
  const systemAudioEnabled = ref(true);
  const cameraLayout = ref<CameraCircleLayout>({ x: 24, y: 24, diameter: 160 });
  const previewCanvas = shallowRef<HTMLCanvasElement | null>(null);
  const elapsedSeconds = ref(0);

  let acquired: AcquiredStreams | null = null;
  let previewCompositor: ReturnType<typeof createPreviewCompositor> | null = null;
  let activeRecording: ActiveRecording | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let screenTrackEndedHandler: (() => void) | null = null;

  const previewAspectRatio = computed(() => {
    if (!acquired) return 16 / 9;
    return acquired.frameWidth / acquired.frameHeight;
  });

  const view = computed((): ScreenRecordingSetupView => ({
    phase: phase.value === "idle" ? "acquiring" : phase.value,
    error: error.value,
    webcamEnabled: webcamEnabled.value,
    micEnabled: micEnabled.value,
    systemAudioEnabled: systemAudioEnabled.value,
    canStart: phase.value === "setup" && acquired != null,
    elapsedLabel: phase.value === "recording" ? formatElapsed(elapsedSeconds.value) : undefined,
    previewAspectRatio: previewAspectRatio.value,
    cameraLayout: cameraLayout.value,
    frameWidth: acquired?.frameWidth ?? 1280,
    frameHeight: acquired?.frameHeight ?? 720,
  }));

  function toggles(): ScreenRecordingToggles {
    return {
      webcamEnabled: webcamEnabled.value,
      micEnabled: micEnabled.value,
      systemAudioEnabled: systemAudioEnabled.value,
    };
  }

  function cleanup() {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = null;
    previewCompositor?.stop();
    previewCompositor = null;
    activeRecording = null;
    if (acquired?.screenStream && screenTrackEndedHandler) {
      const track = acquired.screenStream.getVideoTracks()[0];
      track?.removeEventListener("ended", screenTrackEndedHandler);
    }
    screenTrackEndedHandler = null;
    releaseAcquiredStreams(acquired);
    acquired = null;
    previewCanvas.value = null;
    elapsedSeconds.value = 0;
  }

  function cancel() {
    cleanup();
    phase.value = "idle";
    error.value = undefined;
  }

  async function begin() {
    if (phase.value !== "idle") return;
    error.value = undefined;
    phase.value = "acquiring";

    try {
      acquired = await acquireScreenRecordingStreams(toggles());
      cameraLayout.value = defaultCameraLayout(acquired.frameWidth, acquired.frameHeight);

      const track = acquired.screenStream.getVideoTracks()[0];
      screenTrackEndedHandler = () => {
        error.value = "Screen sharing ended";
        cancel();
      };
      track?.addEventListener("ended", screenTrackEndedHandler);

      previewCompositor = createPreviewCompositor(
        acquired,
        () => cameraLayout.value,
        () => webcamEnabled.value && acquired?.webcamVideo != null,
      );
      previewCompositor.start();
      previewCanvas.value = previewCompositor.canvas;
      phase.value = "setup";
    } catch (cause) {
      cleanup();
      phase.value = "idle";
      error.value =
        cause instanceof Error && cause.name === "NotAllowedError"
          ? "Permission denied"
          : "Could not start screen capture";
    }
  }

  function setCameraLayout(layout: CameraCircleLayout) {
    if (!acquired) return;
    cameraLayout.value = clampCameraLayout(layout, acquired.frameWidth, acquired.frameHeight);
  }

  function moveCameraByDisplayDelta(
    deltaDisplayX: number,
    deltaDisplayY: number,
    displayWidth: number,
    displayHeight: number,
  ) {
    if (!acquired || displayWidth <= 0 || displayHeight <= 0) return;
    const scaleX = acquired.frameWidth / displayWidth;
    const scaleY = acquired.frameHeight / displayHeight;
    setCameraLayout({
      ...cameraLayout.value,
      x: cameraLayout.value.x + deltaDisplayX * scaleX,
      y: cameraLayout.value.y + deltaDisplayY * scaleY,
    });
  }

  function moveCameraToDisplayPoint(displayX: number, displayY: number, displayWidth: number, displayHeight: number) {
    if (!acquired) return;
    const center = displayPointToCapture(
      displayX,
      displayY,
      displayWidth,
      displayHeight,
      acquired.frameWidth,
      acquired.frameHeight,
    );
    setCameraLayout({
      ...cameraLayout.value,
      x: center.x - cameraLayout.value.diameter / 2,
      y: center.y - cameraLayout.value.diameter / 2,
    });
  }

  async function startRecording(): Promise<void> {
    if (!acquired || phase.value !== "setup") return;
    phase.value = "recording";
    elapsedSeconds.value = 0;
    elapsedTimer = setInterval(() => {
      elapsedSeconds.value += 1;
    }, 1000);

    previewCompositor?.stop();
    activeRecording = startCanvasRecording(
      acquired,
      () => cameraLayout.value,
      () => webcamEnabled.value && acquired?.webcamVideo != null,
    );
    previewCanvas.value = activeRecording.canvas;
  }

  async function stopRecording(): Promise<Blob | null> {
    if (!activeRecording) return null;
    phase.value = "finalizing";
    try {
      const blob = await activeRecording.stop();
      return blob;
    } finally {
      cleanup();
      phase.value = "idle";
    }
  }

  onScopeDispose(() => cancel());

  return {
    phase,
    view,
    previewCanvas,
    begin,
    cancel,
    startRecording,
    stopRecording,
    setCameraLayout,
    moveCameraByDisplayDelta,
    moveCameraToDisplayPoint,
    webcamEnabled,
    micEnabled,
    systemAudioEnabled,
  };
}
