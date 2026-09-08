export function pickAudioRecorderMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "audio/webm";
}

export function audioRecordingFilename(mimeType: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "m4a";
  return `voice-${stamp}.${ext}`;
}

export type ActiveAudioRecording = {
  stop: () => Promise<File>;
  abort: () => void;
};

export async function startAudioRecording(deviceId?: string | null): Promise<ActiveAudioRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  });

  const mimeType = pickAudioRecorderMimeType();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start(250);

  let stopped = false;

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    abort: () => {
      if (stopped) return;
      stopped = true;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Recorder may already be stopping.
        }
      }
      cleanup();
    },
    stop: () =>
      new Promise<File>((resolve, reject) => {
        if (stopped) {
          reject(new Error("Recording already stopped"));
          return;
        }
        stopped = true;

        recorder.onstop = () => {
          cleanup();
          const blob = new Blob(chunks, { type: mimeType });
          resolve(new File([blob], audioRecordingFilename(mimeType), { type: mimeType }));
        };
        recorder.onerror = () => {
          cleanup();
          reject(new Error("Recording failed"));
        };

        if (recorder.state !== "inactive") {
          recorder.requestData();
          recorder.stop();
        }
      }),
  };
}
