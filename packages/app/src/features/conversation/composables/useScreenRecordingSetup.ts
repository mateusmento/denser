import { useDevicesList } from "@vueuse/core";
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import {
  clampCameraLayout,
  defaultCameraLayout,
  displayPointToCapture,
  readVideoIntrinsicSize,
  type CameraCircleLayout,
} from "../lib/screen-recording-composite";
import {
  resizeCameraLayout,
  type CameraResizeHandle,
} from "../lib/screen-recording-resize";
import {
  acquireScreenRecordingStreams,
  applyStreamToggles,
  createPreviewCompositor,
  releaseAcquiredStreams,
  replaceMicStream,
  replaceWebcamStream,
  startCanvasRecording,
  type AcquiredStreams,
  type ActiveRecording,
  type ScreenRecordingToggles,
} from "../lib/screen-recording-capture";
import {
  streamNeedsDeviceSwitch,
  toRecordingDeviceOptions,
  trackDeviceId,
} from "../lib/screen-recording-devices";
import {
  clearCompositorCanvasMount,
  mountCompositorCanvas,
} from "../lib/screen-recording-preview-mount";
import { shouldDrawWebcamOnCanvas } from "../lib/screen-recording-overlay-visibility";
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
  const webcamDeviceId = ref<string | null>(null);
  const micDeviceId = ref<string | null>(null);
  const cameraLayout = ref<CameraCircleLayout>({ x: 24, y: 24, diameter: 160 });
  const previewCanvas = shallowRef<HTMLCanvasElement | null>(null);
  const elapsedSeconds = ref(0);
  const acquired = shallowRef<AcquiredStreams | null>(null);
  const { videoInputs, audioInputs, ensurePermissions } = useDevicesList();
  const cameras = computed(() => toRecordingDeviceOptions(videoInputs.value, "Camera"));
  const microphones = computed(() => toRecordingDeviceOptions(audioInputs.value, "Microphone"));

  let previewCompositor: ReturnType<typeof createPreviewCompositor> | null = null;
  let activeRecording: ActiveRecording | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let screenTrackEndedHandler: (() => void) | null = null;

  function isWebcamOverlayVisible(): boolean {
    return shouldDrawWebcamOnCanvas(webcamEnabled.value, acquired.value?.webcamVideo != null);
  }

  const previewAspectRatio = computed(() => {
    const streams = acquired.value;
    if (!streams) return 16 / 9;
    const { width, height } = readVideoIntrinsicSize(
      streams.screenVideo,
      streams.frameWidth,
      streams.frameHeight,
    );
    return width / height;
  });

  const view = computed((): ScreenRecordingSetupView => {
    const streams = acquired.value;
    const frameSize = streams
      ? readVideoIntrinsicSize(streams.screenVideo, streams.frameWidth, streams.frameHeight)
      : { width: 1280, height: 720 };

    return {
      phase: phase.value === "idle" ? "setup" : phase.value,
      error: error.value,
      webcamEnabled: webcamEnabled.value,
      webcamAvailable: streams?.webcamVideo != null,
      webcamDeviceId: webcamDeviceId.value,
      micEnabled: micEnabled.value,
      micDeviceId: micDeviceId.value,
      systemAudioEnabled: systemAudioEnabled.value,
      cameras: cameras.value,
      microphones: microphones.value,
      canStart: phase.value === "setup" && streams != null,
      elapsedLabel: phase.value === "recording" ? formatElapsed(elapsedSeconds.value) : undefined,
      previewAspectRatio: previewAspectRatio.value,
      cameraLayout: cameraLayout.value,
      frameWidth: frameSize.width,
      frameHeight: frameSize.height,
    };
  });

  function toggles(): ScreenRecordingToggles {
    return {
      webcamEnabled: webcamEnabled.value,
      micEnabled: micEnabled.value,
      systemAudioEnabled: systemAudioEnabled.value,
      webcamDeviceId: webcamDeviceId.value,
      micDeviceId: micDeviceId.value,
    };
  }

  function syncSelectedDeviceIds(streams: AcquiredStreams) {
    webcamDeviceId.value = trackDeviceId(streams.webcamStream, "video") ?? webcamDeviceId.value;
    micDeviceId.value = trackDeviceId(streams.micStream, "audio") ?? micDeviceId.value;
  }

  async function syncWebcamStream() {
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") {
      if (streams) applyStreamToggles(streams, toggles());
      return;
    }
    if (!webcamEnabled.value) {
      applyStreamToggles(streams, toggles());
      return;
    }
    if (
      !streamNeedsDeviceSwitch(
        streams.webcamStream != null,
        trackDeviceId(streams.webcamStream, "video"),
        webcamDeviceId.value,
      )
    ) {
      applyStreamToggles(streams, toggles());
      return;
    }
    const switched = await replaceWebcamStream(streams, webcamDeviceId.value);
    if (!switched) {
      error.value = "Could not switch camera";
      applyStreamToggles(streams, toggles());
      return;
    }
    error.value = undefined;
    syncSelectedDeviceIds(streams);
    applyStreamToggles(streams, toggles());
  }

  async function syncMicStream() {
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") {
      if (streams) applyStreamToggles(streams, toggles());
      return;
    }
    if (!micEnabled.value) {
      applyStreamToggles(streams, toggles());
      return;
    }
    if (
      !streamNeedsDeviceSwitch(
        streams.micStream != null,
        trackDeviceId(streams.micStream, "audio"),
        micDeviceId.value,
      )
    ) {
      applyStreamToggles(streams, toggles());
      return;
    }
    const switched = await replaceMicStream(streams, micDeviceId.value);
    if (!switched) {
      error.value = "Could not switch microphone";
      applyStreamToggles(streams, toggles());
      return;
    }
    error.value = undefined;
    syncSelectedDeviceIds(streams);
    applyStreamToggles(streams, toggles());
  }

  watch(webcamEnabled, () => {
    void syncWebcamStream();
  });

  watch(micEnabled, () => {
    void syncMicStream();
  });

  watch(systemAudioEnabled, () => {
    if (!acquired.value) return;
    applyStreamToggles(acquired.value, toggles());
  });

  function releaseResources(abortRecording = false) {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = null;
    previewCompositor?.stop();
    previewCompositor = null;
    if (abortRecording) {
      activeRecording?.abort();
    }
    activeRecording = null;
    const streams = acquired.value;
    if (streams?.screenStream && screenTrackEndedHandler) {
      const track = streams.screenStream.getVideoTracks()[0];
      track?.removeEventListener("ended", screenTrackEndedHandler);
    }
    screenTrackEndedHandler = null;
    releaseAcquiredStreams(streams);
    acquired.value = null;
    clearCompositorCanvasMount();
    previewCanvas.value = null;
    elapsedSeconds.value = 0;
  }

  function cleanup() {
    releaseResources(true);
  }

  function cancel() {
    cleanup();
    phase.value = "idle";
    error.value = undefined;
    webcamEnabled.value = true;
    micEnabled.value = true;
    systemAudioEnabled.value = true;
  }

  async function begin(): Promise<boolean> {
    if (phase.value !== "idle") {
      return acquired.value != null;
    }
    error.value = undefined;
    phase.value = "acquiring";

    try {
      const streams = await acquireScreenRecordingStreams(toggles());
      acquired.value = streams;
      await ensurePermissions();
      syncSelectedDeviceIds(streams);
      cameraLayout.value = defaultCameraLayout(streams.frameWidth, streams.frameHeight);

      const track = streams.screenStream.getVideoTracks()[0];
      screenTrackEndedHandler = () => {
        error.value = "Screen sharing ended";
        cancel();
      };
      track?.addEventListener("ended", screenTrackEndedHandler);

      previewCompositor = createPreviewCompositor(
        streams,
        () => cameraLayout.value,
        isWebcamOverlayVisible,
      );
      previewCompositor.start();
      previewCanvas.value = previewCompositor.canvas;
      phase.value = "setup";
      return true;
    } catch (cause) {
      cleanup();
      phase.value = "idle";
      error.value =
        cause instanceof Error && cause.name === "NotAllowedError"
          ? "Permission denied"
          : "Could not start screen capture";
      return false;
    }
  }

  function captureFrameSize() {
    const streams = acquired.value;
    if (!streams) return { width: 1280, height: 720 };
    return readVideoIntrinsicSize(streams.screenVideo, streams.frameWidth, streams.frameHeight);
  }

  function setCameraLayout(layout: CameraCircleLayout) {
    if (!acquired.value) return;
    const { width, height } = captureFrameSize();
    cameraLayout.value = clampCameraLayout(layout, width, height);
  }

  function resizeCamera(
    handle: CameraResizeHandle,
    deltaCaptureX: number,
    deltaCaptureY: number,
    baseLayout?: CameraCircleLayout,
  ) {
    if (!acquired.value || phase.value !== "setup") return;
    const { width, height } = captureFrameSize();
    cameraLayout.value = resizeCameraLayout(
      handle,
      baseLayout ?? cameraLayout.value,
      deltaCaptureX,
      deltaCaptureY,
      width,
      height,
    );
  }

  function moveCameraByDisplayDelta(
    deltaDisplayX: number,
    deltaDisplayY: number,
    displayWidth: number,
    displayHeight: number,
  ) {
    const streams = acquired.value;
    if (!streams || displayWidth <= 0 || displayHeight <= 0) return;
    const scaleX = streams.frameWidth / displayWidth;
    const scaleY = streams.frameHeight / displayHeight;
    setCameraLayout({
      ...cameraLayout.value,
      x: cameraLayout.value.x + deltaDisplayX * scaleX,
      y: cameraLayout.value.y + deltaDisplayY * scaleY,
    });
  }

  function moveCameraToDisplayPoint(displayX: number, displayY: number, displayWidth: number, displayHeight: number) {
    const streams = acquired.value;
    if (!streams) return;
    const center = displayPointToCapture(
      displayX,
      displayY,
      displayWidth,
      displayHeight,
      streams.frameWidth,
      streams.frameHeight,
    );
    setCameraLayout({
      ...cameraLayout.value,
      x: center.x - cameraLayout.value.diameter / 2,
      y: center.y - cameraLayout.value.diameter / 2,
    });
  }

  async function startRecording(): Promise<void> {
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") return;
    phase.value = "recording";
    elapsedSeconds.value = 0;
    elapsedTimer = setInterval(() => {
      elapsedSeconds.value += 1;
    }, 1000);

    previewCompositor?.stop();
    activeRecording = await startCanvasRecording(streams, () => cameraLayout.value, isWebcamOverlayVisible);
    previewCanvas.value = activeRecording.canvas;
    mountCompositorCanvas(activeRecording.canvas);
  }

  async function stopRecording(): Promise<File | null> {
    const recording = activeRecording;
    if (!recording) return null;
    phase.value = "finalizing";
    try {
      return await recording.stop();
    } catch {
      error.value = "Could not finalize recording";
      recording.abort();
      return null;
    } finally {
      releaseResources(false);
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
    resizeCamera,
    moveCameraByDisplayDelta,
    moveCameraToDisplayPoint,
    setWebcamEnabled: (value: boolean) => {
      webcamEnabled.value = value;
    },
    setMicEnabled: (value: boolean) => {
      micEnabled.value = value;
    },
    setSystemAudioEnabled: (value: boolean) => {
      systemAudioEnabled.value = value;
    },
    setWebcamDeviceId: (value: string) => {
      webcamDeviceId.value = value;
      void syncWebcamStream();
    },
    setMicDeviceId: (value: string) => {
      micDeviceId.value = value;
      void syncMicStream();
    },
    webcamEnabled,
    micEnabled,
    systemAudioEnabled,
  };
}
