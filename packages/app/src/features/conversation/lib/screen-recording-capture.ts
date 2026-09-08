import type { CameraCircleLayout } from "./screen-recording-composite";
import {
  canDrawVideoFrame,
  drawCompositeFrame,
  readVideoIntrinsicSize,
  type DrawCompositeOptions,
} from "./screen-recording-composite";
import {
  microphoneAudioConstraints,
  webcamVideoConstraints,
} from "./screen-recording-devices";
import {
  createRecordingChunkSink,
} from "./screen-recording-persistence";

export type ScreenRecordingToggles = {
  webcamEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  mirrorCamera: boolean;
  webcamDeviceId?: string | null;
  micDeviceId?: string | null;
};

export type AcquiredStreams = {
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
  micStream: MediaStream | null;
  frameWidth: number;
  frameHeight: number;
  screenVideo: HTMLVideoElement | null;
  webcamVideo: HTMLVideoElement | null;
  audioContext: AudioContext;
  audioDestination: MediaStreamAudioDestinationNode;
  screenAudioSources: MediaStreamAudioSourceNode[];
  micAudioSources: MediaStreamAudioSourceNode[];
  mixedAudioStream: MediaStream;
};

export type CompositeFrameContext = () => DrawCompositeOptions;

let mediaVideoMount: HTMLDivElement | null = null;

function ensureMediaVideoMount(): HTMLDivElement {
  if (!mediaVideoMount) {
    mediaVideoMount = document.createElement("div");
    mediaVideoMount.setAttribute("data-screen-recording-media-mount", "");
    mediaVideoMount.style.cssText =
      "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(mediaVideoMount);
  }
  return mediaVideoMount;
}

function mountMediaVideo(video: HTMLVideoElement) {
  const mount = ensureMediaVideoMount();
  video.style.width = "1px";
  video.style.height = "1px";
  mount.appendChild(video);
}

function clearMediaVideoMount() {
  mediaVideoMount?.replaceChildren();
}

export function pickRecorderMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "video/webm";
}

const RECORDING_FPS = 30;

export function recordingFilename(mimeType: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = mimeType.includes("webm") ? "webm" : "mp4";
  return `recording-${stamp}.${ext}`;
}

async function playVideoElement(video: HTMLVideoElement, stream: MediaStream) {
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

async function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (canDrawVideoFrame(video)) return;

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      if (canDrawVideoFrame(video)) {
        cleanup();
        resolve();
      }
    };
    const onError = () => {
      cleanup();
      reject(new Error("Video failed to load"));
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError, { once: true });
    onReady();
  });
}

async function waitForVideoDimensions(video: HTMLVideoElement): Promise<{ width: number; height: number }> {
  await waitForVideoReady(video);
  return {
    width: video.videoWidth || 1280,
    height: video.videoHeight || 720,
  };
}

function connectAudioTracks(
  audioContext: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  stream: MediaStream,
): MediaStreamAudioSourceNode[] {
  return stream.getAudioTracks().map((track) => {
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    source.connect(destination);
    return source;
  });
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function acquireWebcamMedia(deviceId?: string | null): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: webcamVideoConstraints(deviceId),
    });
  } catch {
    return null;
  }
}

async function acquireMicMedia(deviceId?: string | null): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: microphoneAudioConstraints(deviceId),
    });
  } catch {
    return null;
  }
}

async function attachWebcamStream(acquired: AcquiredStreams, stream: MediaStream) {
  if (!acquired.webcamVideo) {
    acquired.webcamVideo = document.createElement("video");
    mountMediaVideo(acquired.webcamVideo);
  }
  await playVideoElement(acquired.webcamVideo, stream);
  await waitForVideoReady(acquired.webcamVideo);
}

function syncFrameSizeFromPrimarySource(acquired: AcquiredStreams) {
  if (acquired.screenVideo && canDrawVideoFrame(acquired.screenVideo)) {
    const { width, height } = readVideoIntrinsicSize(
      acquired.screenVideo,
      acquired.frameWidth,
      acquired.frameHeight,
    );
    acquired.frameWidth = width;
    acquired.frameHeight = height;
    return;
  }

  if (acquired.webcamVideo && canDrawVideoFrame(acquired.webcamVideo)) {
    const { width, height } = readVideoIntrinsicSize(
      acquired.webcamVideo,
      acquired.frameWidth,
      acquired.frameHeight,
    );
    acquired.frameWidth = width;
    acquired.frameHeight = height;
  }
}

/** Begin a recording session with webcam/mic only — screen is acquired on toggle. */
export async function createRecordingSession(
  toggles: ScreenRecordingToggles,
): Promise<AcquiredStreams> {
  const audioContext = new AudioContext();
  await audioContext.resume().catch(() => undefined);
  const audioDestination = audioContext.createMediaStreamDestination();

  const micStream = toggles.micEnabled ? await acquireMicMedia(toggles.micDeviceId) : null;
  const micAudioSources = micStream
    ? connectAudioTracks(audioContext, audioDestination, micStream)
    : [];

  const acquired: AcquiredStreams = {
    screenStream: null,
    webcamStream: null,
    micStream,
    frameWidth: 1280,
    frameHeight: 720,
    screenVideo: null,
    webcamVideo: null,
    audioContext,
    audioDestination,
    screenAudioSources: [],
    micAudioSources,
    mixedAudioStream: audioDestination.stream,
  };

  if (toggles.webcamEnabled) {
    const webcamStream = await acquireWebcamMedia(toggles.webcamDeviceId);
    if (webcamStream) {
      acquired.webcamStream = webcamStream;
      await attachWebcamStream(acquired, webcamStream);
      syncFrameSizeFromPrimarySource(acquired);
    }
  }

  applyStreamToggles(acquired, toggles);
  return acquired;
}

export async function acquireScreenStream(
  acquired: AcquiredStreams,
  toggles: ScreenRecordingToggles,
): Promise<boolean> {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: toggles.systemAudioEnabled,
    });

    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack) {
      stopStream(screenStream);
      return false;
    }

    acquired.screenStream = screenStream;
    acquired.screenVideo = document.createElement("video");
    mountMediaVideo(acquired.screenVideo);
    await playVideoElement(acquired.screenVideo, screenStream);
    await waitForVideoReady(acquired.screenVideo);
    syncFrameSizeFromPrimarySource(acquired);

    acquired.screenAudioSources = connectAudioTracks(
      acquired.audioContext,
      acquired.audioDestination,
      screenStream,
    );

    applyStreamToggles(acquired, toggles);
    return true;
  } catch {
    return false;
  }
}

export function releaseScreenStream(acquired: AcquiredStreams) {
  for (const source of acquired.screenAudioSources) {
    source.disconnect();
  }
  acquired.screenAudioSources = [];

  stopStream(acquired.screenStream);
  acquired.screenStream = null;

  if (acquired.screenVideo) {
    acquired.screenVideo.pause();
    acquired.screenVideo.srcObject = null;
    acquired.screenVideo = null;
  }

  syncFrameSizeFromPrimarySource(acquired);
}

export async function replaceWebcamStream(
  acquired: AcquiredStreams,
  deviceId?: string | null,
): Promise<boolean> {
  const next = await acquireWebcamMedia(deviceId);
  if (!next) return false;
  const previous = acquired.webcamStream;
  acquired.webcamStream = next;
  await attachWebcamStream(acquired, next);
  stopStream(previous);
  syncFrameSizeFromPrimarySource(acquired);
  return true;
}

export async function replaceMicStream(
  acquired: AcquiredStreams,
  deviceId?: string | null,
): Promise<boolean> {
  const next = await acquireMicMedia(deviceId);
  if (!next) return false;

  for (const source of acquired.micAudioSources) {
    source.disconnect();
  }
  stopStream(acquired.micStream);
  acquired.micStream = next;
  acquired.micAudioSources = connectAudioTracks(
    acquired.audioContext,
    acquired.audioDestination,
    next,
  );
  return true;
}

/** Mute/unmute tracks that were already acquired. */
export function applyStreamToggles(acquired: AcquiredStreams, toggles: ScreenRecordingToggles) {
  acquired.screenStream?.getAudioTracks().forEach((track) => {
    track.enabled = toggles.systemAudioEnabled;
  });
  acquired.micStream?.getAudioTracks().forEach((track) => {
    track.enabled = toggles.micEnabled;
  });
  acquired.webcamStream?.getVideoTracks().forEach((track) => {
    track.enabled = toggles.webcamEnabled;
  });
}

export function releaseAcquiredStreams(acquired: AcquiredStreams | null) {
  if (!acquired) return;

  acquired.screenStream?.getTracks().forEach((track) => track.stop());
  acquired.webcamStream?.getTracks().forEach((track) => track.stop());
  acquired.micStream?.getTracks().forEach((track) => track.stop());

  acquired.screenVideo?.pause();
  if (acquired.screenVideo) acquired.screenVideo.srcObject = null;
  acquired.webcamVideo?.pause();
  if (acquired.webcamVideo) acquired.webcamVideo.srcObject = null;

  clearMediaVideoMount();
  void acquired.audioContext.close().catch(() => undefined);
}

function syncCanvasToFrame(canvas: HTMLCanvasElement, acquired: AcquiredStreams): boolean {
  const screenReady = acquired.screenVideo != null && canDrawVideoFrame(acquired.screenVideo);
  const webcamReady = acquired.webcamVideo != null && canDrawVideoFrame(acquired.webcamVideo);
  if (!screenReady && !webcamReady) return false;

  const source = screenReady ? acquired.screenVideo! : acquired.webcamVideo!;
  const { width, height } = readVideoIntrinsicSize(source, acquired.frameWidth, acquired.frameHeight);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  acquired.frameWidth = width;
  acquired.frameHeight = height;
  return true;
}

export type PreviewCompositor = {
  canvas: HTMLCanvasElement;
  start: () => void;
  stop: () => void;
};

export type PreviewCompositorOptions = {
  /** Cap compositor redraw rate (e.g. 30 during recording). Preview setup uses display refresh. */
  maxFps?: number;
};

export function createPreviewCompositor(
  acquired: AcquiredStreams,
  getLayout: () => CameraCircleLayout,
  getCompositeOptions: CompositeFrameContext,
  options: PreviewCompositorOptions = {},
): PreviewCompositor {
  const canvas = document.createElement("canvas");
  syncCanvasToFrame(canvas, acquired);
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) throw new Error("Canvas 2d unavailable");

  const minFrameIntervalMs = options.maxFps ? 1000 / options.maxFps : 0;
  let running = false;
  let rafId = 0;
  let lastFrameTime = 0;

  const tick = (timestamp: number) => {
    if (!running) return;

    if (minFrameIntervalMs > 0 && timestamp - lastFrameTime < minFrameIntervalMs) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    lastFrameTime = timestamp;

    if (!syncCanvasToFrame(canvas, acquired)) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    drawCompositeFrame(
      ctx,
      acquired.screenVideo,
      acquired.webcamVideo,
      getLayout(),
      acquired.frameWidth,
      acquired.frameHeight,
      getCompositeOptions(),
    );
    rafId = requestAnimationFrame(tick);
  };

  return {
    canvas,
    start: () => {
      if (running) return;
      running = true;
      lastFrameTime = 0;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}

export type ActiveRecording = {
  stop: () => Promise<File>;
  abort: () => void;
  mimeType: string;
  canvas: HTMLCanvasElement;
};

export async function startCanvasRecording(
  acquired: AcquiredStreams,
  getLayout: () => CameraCircleLayout,
  getCompositeOptions: CompositeFrameContext,
): Promise<ActiveRecording> {
  const compositor = createPreviewCompositor(acquired, getLayout, getCompositeOptions, {
    maxFps: RECORDING_FPS,
  });
  compositor.start();

  const canvasStream = compositor.canvas.captureStream(RECORDING_FPS);
  for (const track of acquired.mixedAudioStream.getAudioTracks()) {
    canvasStream.addTrack(track);
  }

  const mimeType = pickRecorderMimeType();
  const sink = await createRecordingChunkSink(mimeType, recordingFilename(mimeType));
  const recorder = new MediaRecorder(canvasStream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) sink.append(event.data);
  };

  recorder.start(250);

  let stopped = false;

  const finalizeCompositor = () => {
    compositor.stop();
  };

  const abortSink = () => {
    void sink.abort().catch(() => undefined);
  };

  return {
    mimeType,
    canvas: compositor.canvas,
    abort: () => {
      if (stopped) return;
      stopped = true;
      finalizeCompositor();
      abortSink();
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Recorder may already be stopping.
        }
      }
    },
    stop: () =>
      new Promise<File>((resolve, reject) => {
        if (stopped) {
          reject(new Error("Recording already stopped"));
          return;
        }
        stopped = true;

        recorder.onstop = () => {
          finalizeCompositor();
          void sink
            .finalize()
            .then(resolve)
            .catch((error) => reject(error instanceof Error ? error : new Error("Recording failed")));
        };
        recorder.onerror = () => {
          finalizeCompositor();
          abortSink();
          reject(new Error("Recording failed"));
        };

        if (recorder.state !== "inactive") {
          recorder.requestData();
          recorder.stop();
        } else {
          finalizeCompositor();
          void sink
            .finalize()
            .then(resolve)
            .catch((error) => reject(error instanceof Error ? error : new Error("Recording failed")));
        }
      }),
  };
}
