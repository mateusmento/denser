import { useDevicesList, useEventListener } from "@vueuse/core";
import { computed, onScopeDispose, ref, shallowRef, watch } from "vue";
import {
  clampCameraLayout,
  defaultCameraLayout,
  displayPointToCapture,
  readVideoIntrinsicSize,
  canDrawVideoFrame,
  type CameraCircleLayout,
} from "../lib/video-recording-composite";
import {
  resizeCameraLayout,
  type CameraResizeHandle,
} from "../lib/video-recording-resize";
import {
  acquireScreenStream,
  applyStreamToggles,
  createPreviewCompositor,
  createRecordingSession,
  releaseAcquiredStreams,
  releaseScreenStream,
  replaceMicStream,
  replaceWebcamStream,
  startCanvasRecording,
  type AcquiredStreams,
  type ActiveRecording,
  type VideoRecordingToggles,
} from "../lib/video-recording-capture";
import {
  dedicatedMicrophoneDevices,
  streamNeedsDeviceSwitch,
  toRecordingDeviceOptions,
  trackDeviceId,
} from "../lib/video-recording-devices";
import {
  clearCompositorCanvasMount,
  mountCompositorCanvas,
} from "../lib/video-recording-preview-mount";
import { shouldDrawWebcamOverlay } from "../lib/video-recording-overlay-visibility";
import type { VideoRecordingPhase, VideoRecordingSetupView } from "../types";

export type VideoRecordingViewer = {
  name: string;
  initials: string;
  avatarUrl?: string;
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useVideoRecordingSetup(options: {
  viewer?: () => VideoRecordingViewer | null;
} = {}) {
  const phase = ref<VideoRecordingPhase | "idle">("idle");
  const error = ref<string | undefined>();
  const webcamEnabled = ref(true);
  const screenEnabled = ref(false);
  const micEnabled = ref(true);
  const systemAudioEnabled = ref(false);
  const mirrorCamera = ref(false);
  const overlayEditMode = ref(false);
  const webcamDeviceId = ref<string | null>(null);
  const micDeviceId = ref<string | null>(null);
  const cameraLayout = ref<CameraCircleLayout>({ x: 24, y: 24, diameter: 160 });
  const previewCanvas = shallowRef<HTMLCanvasElement | null>(null);
  const elapsedSeconds = ref(0);
  const acquired = shallowRef<AcquiredStreams | null>(null);
  const streamRevision = ref(0);

  function notifyStreamsChanged() {
    streamRevision.value += 1;
  }
  const { videoInputs, audioInputs, ensurePermissions } = useDevicesList();
  const cameras = computed(() => toRecordingDeviceOptions(videoInputs.value, "Camera"));
  const microphones = computed(() =>
    toRecordingDeviceOptions(
      dedicatedMicrophoneDevices(audioInputs.value, videoInputs.value),
      "Microphone",
    ),
  );

  let previewCompositor: ReturnType<typeof createPreviewCompositor> | null = null;
  let activeRecording: ActiveRecording | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;

  const screenVideoTrack = computed(
    () => acquired.value?.screenStream?.getVideoTracks()[0] ?? undefined,
  );

  useEventListener(screenVideoTrack, "ended", () => {
    if (!acquired.value?.screenStream) return;
    if (phase.value === "recording" || phase.value === "finalizing") {
      error.value = "Screen sharing ended";
      cancel();
      return;
    }
    screenEnabled.value = false;
    releaseScreenStream(acquired.value);
    overlayEditMode.value = false;
    restartPreviewCompositor();
  });

  function compositeOptions() {
    const streams = acquired.value;
    const hasWebcamVideo = streams?.webcamVideo != null && canDrawVideoFrame(streams.webcamVideo);
    const hasScreenVideo = streams?.screenVideo != null && canDrawVideoFrame(streams.screenVideo);
    return {
      mirrorCamera: mirrorCamera.value,
      drawWebcamOverlay: shouldDrawWebcamOverlay(
        webcamEnabled.value,
        hasWebcamVideo,
        screenEnabled.value,
        hasScreenVideo,
      ),
    };
  }

  const previewAspectRatio = computed(() => {
    const streams = acquired.value;
    if (!streams) return 16 / 9;
    const primary = streams.screenVideo ?? streams.webcamVideo;
    if (!primary) return 16 / 9;
    const { width, height } = readVideoIntrinsicSize(
      primary,
      streams.frameWidth,
      streams.frameHeight,
    );
    return width / height;
  });

  function hasDrawableVideo(): boolean {
    const streams = acquired.value;
    if (!streams) return false;
    if (streams.screenVideo && canDrawVideoFrame(streams.screenVideo)) return true;
    return (
      webcamEnabled.value &&
      streams.webcamVideo != null &&
      canDrawVideoFrame(streams.webcamVideo)
    );
  }

  function showOverlayEditor(): boolean {
    void streamRevision.value;
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") return false;
    return shouldDrawWebcamOverlay(
      webcamEnabled.value,
      webcamEnabled.value && streams.webcamVideo != null,
      screenEnabled.value,
      screenEnabled.value && streams.screenVideo != null,
    );
  }

  const overlayEditorVisible = computed(() => showOverlayEditor());

  const view = computed((): VideoRecordingSetupView => {
    const streams = acquired.value;
    const frameSize = streams
      ? (() => {
          const primary = streams.screenVideo ?? streams.webcamVideo;
          if (!primary) {
            return { width: streams.frameWidth, height: streams.frameHeight };
          }
          return readVideoIntrinsicSize(primary, streams.frameWidth, streams.frameHeight);
        })()
      : { width: 1280, height: 720 };
    const viewer = options.viewer?.() ?? null;
    const showAvatarFallback =
      phase.value === "setup" && !hasDrawableVideo();

    return {
      phase: phase.value === "idle" ? "setup" : phase.value,
      error: error.value,
      webcamEnabled: webcamEnabled.value,
      webcamAvailable: streams?.webcamVideo != null,
      screenEnabled: screenEnabled.value,
      screenAvailable: streams?.screenStream != null,
      webcamDeviceId: webcamDeviceId.value,
      micEnabled: micEnabled.value,
      micDeviceId: micDeviceId.value,
      systemAudioEnabled: systemAudioEnabled.value,
      mirrorCamera: mirrorCamera.value,
      cameras: cameras.value,
      microphones: microphones.value,
      canStart: phase.value === "setup" && hasDrawableVideo(),
      showCameraOverlayEditor: overlayEditorVisible.value,
      overlayEditMode: overlayEditMode.value,
      showAvatarFallback,
      avatarUrl: viewer?.avatarUrl,
      avatarInitials: viewer?.initials ?? "?",
      avatarName: viewer?.name ?? "You",
      elapsedLabel: phase.value === "recording" ? formatElapsed(elapsedSeconds.value) : undefined,
      previewAspectRatio: previewAspectRatio.value,
      cameraLayout: cameraLayout.value,
      frameWidth: streams?.frameWidth ?? frameSize.width,
      frameHeight: streams?.frameHeight ?? frameSize.height,
    };
  });

  function restartPreviewCompositor() {
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") return;
    previewCompositor?.stop();
    previewCompositor = createPreviewCompositor(
      streams,
      () => cameraLayout.value,
      compositeOptions,
    );
    previewCompositor.start();
    previewCanvas.value = previewCompositor.canvas;
    notifyStreamsChanged();
  }

  watch(screenEnabled, async (enabled) => {
    const streams = acquired.value;
    if (!streams || phase.value !== "setup") return;
    if (enabled) {
      systemAudioEnabled.value = true;
      const attached = await acquireScreenStream(streams, toggles());
      if (!attached) {
        screenEnabled.value = false;
        return;
      }
      cameraLayout.value = defaultCameraLayout(streams.frameWidth, streams.frameHeight);
    } else {
      releaseScreenStream(streams);
      systemAudioEnabled.value = false;
      overlayEditMode.value = false;
    }
    restartPreviewCompositor();
  });

  watch(mirrorCamera, () => {
    restartPreviewCompositor();
  });

  watch(overlayEditorVisible, (visible) => {
    if (!visible) overlayEditMode.value = false;
  });

  function toggles(): VideoRecordingToggles {
    return {
      webcamEnabled: webcamEnabled.value,
      screenEnabled: screenEnabled.value,
      micEnabled: micEnabled.value,
      systemAudioEnabled: systemAudioEnabled.value,
      mirrorCamera: mirrorCamera.value,
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
      restartPreviewCompositor();
      return;
    }
    const hasWebcam = streams.webcamStream != null;
    const needsSwitch = streamNeedsDeviceSwitch(
      hasWebcam,
      trackDeviceId(streams.webcamStream, "video"),
      webcamDeviceId.value,
    );
    if (!needsSwitch) {
      applyStreamToggles(streams, toggles());
      restartPreviewCompositor();
      return;
    }
    const switched = await replaceWebcamStream(streams, webcamDeviceId.value);
    if (!switched) {
      error.value = "Could not switch camera";
      applyStreamToggles(streams, toggles());
      restartPreviewCompositor();
      return;
    }
    error.value = undefined;
    syncSelectedDeviceIds(streams);
    applyStreamToggles(streams, toggles());
    restartPreviewCompositor();
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
    screenEnabled.value = false;
    micEnabled.value = true;
    systemAudioEnabled.value = false;
    mirrorCamera.value = false;
    overlayEditMode.value = false;
  }

  async function begin(): Promise<boolean> {
    if (phase.value !== "idle") {
      return acquired.value != null;
    }
    error.value = undefined;
    phase.value = "acquiring";

    try {
      const streams = await createRecordingSession(toggles());
      acquired.value = streams;
      await ensurePermissions();
      syncSelectedDeviceIds(streams);
      if (streams.webcamVideo) {
        cameraLayout.value = defaultCameraLayout(streams.frameWidth, streams.frameHeight);
      }

      previewCompositor = createPreviewCompositor(
        streams,
        () => cameraLayout.value,
        compositeOptions,
      );
      previewCompositor.start();
      previewCanvas.value = previewCompositor.canvas;
      phase.value = "setup";
      return true;
    } catch {
      cleanup();
      phase.value = "idle";
      error.value = "Could not start recording setup";
      return false;
    }
  }

  function captureFrameSize() {
    const streams = acquired.value;
    if (!streams) return { width: 1280, height: 720 };
    const primary = streams.screenVideo ?? streams.webcamVideo;
    if (!primary) return { width: streams.frameWidth, height: streams.frameHeight };
    return readVideoIntrinsicSize(primary, streams.frameWidth, streams.frameHeight);
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

  function moveCameraToDisplayPoint(
    displayX: number,
    displayY: number,
    displayWidth: number,
    displayHeight: number,
  ) {
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
    activeRecording = await startCanvasRecording(
      streams,
      () => cameraLayout.value,
      compositeOptions,
    );
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
    setScreenEnabled: (value: boolean) => {
      screenEnabled.value = value;
    },
    setMirrorCamera: (value: boolean) => {
      mirrorCamera.value = value;
    },
    setOverlayEditMode: (value: boolean) => {
      overlayEditMode.value = value;
    },
    setWebcamDeviceId: (value: string) => {
      webcamDeviceId.value = value;
      void syncWebcamStream();
    },
    setMicDeviceId: (value: string) => {
      micDeviceId.value = value;
      void syncMicStream();
    },
  };
}
