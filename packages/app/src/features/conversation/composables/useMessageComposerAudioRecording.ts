import { computed, onScopeDispose, ref } from "vue";
import { useDevicesList } from "@vueuse/core";
import {
  dedicatedMicrophoneDevices,
  toRecordingDeviceOptions,
} from "../lib/video-recording-devices";
import { startAudioRecording } from "../lib/audio-recording-capture";
import type { AudioRecordingBadgeView } from "../types";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useMessageComposerAudioRecording(options: {
  stageFiles: (files: readonly File[]) => void;
  disabled?: () => boolean;
}) {
  const phase = ref<"idle" | "recording" | "finalizing">("idle");
  const elapsedSeconds = ref(0);
  const micDeviceId = ref<string | null>(null);
  const { audioInputs, videoInputs, ensurePermissions } = useDevicesList({
    constraints: { audio: true, video: false },
  });
  const microphones = computed(() =>
    toRecordingDeviceOptions(
      dedicatedMicrophoneDevices(audioInputs.value, videoInputs.value),
      "Microphone",
    ),
  );

  let activeRecording: Awaited<ReturnType<typeof startAudioRecording>> | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;

  const badgeView = computed((): AudioRecordingBadgeView | null => {
    if (phase.value === "idle") return null;
    return {
      phase: phase.value === "finalizing" ? "finalizing" : "recording",
      elapsedLabel: formatElapsed(elapsedSeconds.value),
    };
  });

  function clearTimer() {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = null;
  }

  function reset() {
    clearTimer();
    activeRecording?.abort();
    activeRecording = null;
    elapsedSeconds.value = 0;
    phase.value = "idle";
  }

  async function startRecording() {
    if (options.disabled?.() || phase.value !== "idle") return;
    try {
      await ensurePermissions();
      activeRecording = await startAudioRecording(micDeviceId.value);
      phase.value = "recording";
      elapsedSeconds.value = 0;
      elapsedTimer = setInterval(() => {
        elapsedSeconds.value += 1;
      }, 1000);
    } catch {
      reset();
    }
  }

  async function stopRecording() {
    const recording = activeRecording;
    if (!recording || phase.value !== "recording") return;
    phase.value = "finalizing";
    clearTimer();
    try {
      const file = await recording.stop();
      activeRecording = null;
      if (file.size > 0) {
        options.stageFiles([file]);
      }
    } finally {
      phase.value = "idle";
      elapsedSeconds.value = 0;
    }
  }

  function setMicDeviceId(deviceId: string) {
    micDeviceId.value = deviceId;
  }

  async function prepareMicrophonePicker() {
    await ensurePermissions();
  }

  onScopeDispose(() => reset());

  return {
    badgeView,
    micDeviceId,
    microphones,
    startRecording,
    stopRecording,
    setMicDeviceId,
    prepareMicrophonePicker,
    cancel: reset,
  };
}
