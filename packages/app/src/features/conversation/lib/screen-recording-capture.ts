import type { CameraCircleLayout } from "./screen-recording-composite";
import {
  canDrawVideoFrame,
  drawCompositeFrame,
  readVideoIntrinsicSize,
} from "./screen-recording-composite";
import {
  createRecordingChunkSink,
} from "./screen-recording-persistence";

export type ScreenRecordingToggles = {
  webcamEnabled: boolean;
  micEnabled: boolean;
  systemAudioEnabled: boolean;
};

export type AcquiredStreams = {
  screenStream: MediaStream;
  webcamStream: MediaStream | null;
  micStream: MediaStream | null;
  frameWidth: number;
  frameHeight: number;
  screenVideo: HTMLVideoElement;
  webcamVideo: HTMLVideoElement | null;
  audioContext: AudioContext;
  mixedAudioStream: MediaStream;
};

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
  // VP9 is intentionally excluded — its software encoder is a common SIGILL source on
  // CPUs without the SIMD paths libvpx expects. VP8 / platform defaults are safer.
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
) {
  for (const track of stream.getAudioTracks()) {
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    source.connect(destination);
  }
}

const SQUARE_WEBCAM_IDEAL_PX = 720;

export async function acquireScreenRecordingStreams(
  toggles: ScreenRecordingToggles,
): Promise<AcquiredStreams> {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: toggles.systemAudioEnabled,
  });

  const videoTrack = screenStream.getVideoTracks()[0];
  if (!videoTrack) throw new Error("Screen capture has no video track");

  let webcamStream: MediaStream | null = null;
  if (toggles.webcamEnabled) {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: SQUARE_WEBCAM_IDEAL_PX },
          height: { ideal: SQUARE_WEBCAM_IDEAL_PX },
          aspectRatio: { ideal: 1 },
        },
      });
    } catch {
      webcamStream = null;
    }
  }

  let micStream: MediaStream | null = null;
  if (toggles.micEnabled) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      micStream = null;
    }
  }

  const audioContext = new AudioContext();
  await audioContext.resume().catch(() => undefined);
  const audioDestination = audioContext.createMediaStreamDestination();
  connectAudioTracks(audioContext, audioDestination, screenStream);
  if (micStream) connectAudioTracks(audioContext, audioDestination, micStream);

  const screenVideo = document.createElement("video");
  mountMediaVideo(screenVideo);
  await playVideoElement(screenVideo, screenStream);
  await waitForVideoReady(screenVideo);
  const { width: frameWidth, height: frameHeight } = await waitForVideoDimensions(screenVideo);

  let webcamVideo: HTMLVideoElement | null = null;
  if (webcamStream) {
    webcamVideo = document.createElement("video");
    mountMediaVideo(webcamVideo);
    await playVideoElement(webcamVideo, webcamStream);
    await waitForVideoReady(webcamVideo);
  }

  const acquired: AcquiredStreams = {
    screenStream,
    webcamStream,
    micStream,
    frameWidth,
    frameHeight,
    screenVideo,
    webcamVideo,
    audioContext,
    mixedAudioStream: audioDestination.stream,
  };
  applyStreamToggles(acquired, toggles);
  return acquired;
}

/** Mute/unmute tracks that were already acquired. Cannot add new sources after pick. */
export function applyStreamToggles(acquired: AcquiredStreams, toggles: ScreenRecordingToggles) {
  for (const track of acquired.screenStream.getAudioTracks()) {
    track.enabled = toggles.systemAudioEnabled;
  }
  acquired.micStream?.getAudioTracks().forEach((track) => {
    track.enabled = toggles.micEnabled;
  });
  acquired.webcamStream?.getVideoTracks().forEach((track) => {
    track.enabled = toggles.webcamEnabled;
  });
}

export function releaseAcquiredStreams(acquired: AcquiredStreams | null) {
  if (!acquired) return;

  acquired.screenStream.getTracks().forEach((track) => track.stop());
  acquired.webcamStream?.getTracks().forEach((track) => track.stop());
  acquired.micStream?.getTracks().forEach((track) => track.stop());

  acquired.screenVideo.pause();
  acquired.screenVideo.srcObject = null;
  if (acquired.webcamVideo) {
    acquired.webcamVideo.pause();
    acquired.webcamVideo.srcObject = null;
  }

  clearMediaVideoMount();
  void acquired.audioContext.close().catch(() => undefined);
}

function syncCanvasToScreen(
  canvas: HTMLCanvasElement,
  screenVideo: HTMLVideoElement,
  frameWidth: number,
  frameHeight: number,
) {
  if (!canDrawVideoFrame(screenVideo)) return false;

  const { width, height } = readVideoIntrinsicSize(screenVideo, frameWidth, frameHeight);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
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
  webcamVisible: () => boolean,
  options: PreviewCompositorOptions = {},
): PreviewCompositor {
  const canvas = document.createElement("canvas");
  syncCanvasToScreen(canvas, acquired.screenVideo, acquired.frameWidth, acquired.frameHeight);
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

    syncCanvasToScreen(canvas, acquired.screenVideo, acquired.frameWidth, acquired.frameHeight);
    drawCompositeFrame(
      ctx,
      acquired.screenVideo,
      acquired.webcamVideo,
      getLayout(),
      acquired.frameWidth,
      acquired.frameHeight,
      webcamVisible(),
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
  webcamVisible: () => boolean,
): Promise<ActiveRecording> {
  const compositor = createPreviewCompositor(acquired, getLayout, webcamVisible, {
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
