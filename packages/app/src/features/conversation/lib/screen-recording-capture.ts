import type { CameraCircleLayout } from "./screen-recording-composite";
import { drawCompositeFrame } from "./screen-recording-composite";

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

export function pickRecorderMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "video/webm";
}

export function recordingFilename(mimeType: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = mimeType.includes("webm") ? "webm" : "mp4";
  return `recording-${stamp}.${ext}`;
}

async function playVideoElement(video: HTMLVideoElement, stream: MediaStream) {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

function connectAudioTracks(audioContext: AudioContext, destination: MediaStreamAudioDestinationNode, stream: MediaStream) {
  for (const track of stream.getAudioTracks()) {
    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
    source.connect(destination);
  }
}

export async function acquireScreenRecordingStreams(
  toggles: ScreenRecordingToggles,
): Promise<AcquiredStreams> {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: toggles.systemAudioEnabled,
  });

  const videoTrack = screenStream.getVideoTracks()[0];
  if (!videoTrack) throw new Error("Screen capture has no video track");
  const settings = videoTrack.getSettings();
  const frameWidth = settings.width ?? 1280;
  const frameHeight = settings.height ?? 720;

  let webcamStream: MediaStream | null = null;
  if (toggles.webcamEnabled) {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
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
  const audioDestination = audioContext.createMediaStreamDestination();
  connectAudioTracks(audioContext, audioDestination, screenStream);
  if (micStream) connectAudioTracks(audioContext, audioDestination, micStream);

  const screenVideo = document.createElement("video");
  await playVideoElement(screenVideo, screenStream);

  let webcamVideo: HTMLVideoElement | null = null;
  if (webcamStream) {
    webcamVideo = document.createElement("video");
    await playVideoElement(webcamVideo, webcamStream);
  }

  return {
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

  void acquired.audioContext.close().catch(() => undefined);
}

export type PreviewCompositor = {
  canvas: HTMLCanvasElement;
  start: () => void;
  stop: () => void;
};

export function createPreviewCompositor(
  acquired: AcquiredStreams,
  getLayout: () => CameraCircleLayout,
  webcamVisible: () => boolean,
): PreviewCompositor {
  const canvas = document.createElement("canvas");
  canvas.width = acquired.frameWidth;
  canvas.height = acquired.frameHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d unavailable");

  let rafId = 0;
  const tick = () => {
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
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    },
    stop: () => cancelAnimationFrame(rafId),
  };
}

export type ActiveRecording = {
  stop: () => Promise<Blob>;
  mimeType: string;
  canvas: HTMLCanvasElement;
};

export function startCanvasRecording(
  acquired: AcquiredStreams,
  getLayout: () => CameraCircleLayout,
  webcamVisible: () => boolean,
): ActiveRecording {
  const compositor = createPreviewCompositor(acquired, getLayout, webcamVisible);
  compositor.start();

  const canvasStream = compositor.canvas.captureStream(30);
  for (const track of acquired.mixedAudioStream.getAudioTracks()) {
    canvasStream.addTrack(track);
  }

  const mimeType = pickRecorderMimeType();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(canvasStream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start(250);

  return {
    mimeType,
    canvas: compositor.canvas,
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          compositor.stop();
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        recorder.onerror = () => reject(new Error("Recording failed"));
        if (recorder.state !== "inactive") recorder.stop();
        else compositor.stop();
      }),
  };
}
