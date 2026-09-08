import { computed, onScopeDispose, ref, watch, type Ref } from "vue";
import { claimAudioPlayback, releaseAudioPlayback } from "../lib/audio-playback-registry";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useAudioPlayer(playerId: string, sourceUrl: Ref<string>) {
  const audio = new Audio();
  audio.preload = "metadata";

  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const isReady = ref(false);
  const hasError = ref(false);

  const progress = computed(() => {
    if (!duration.value) return 0;
    return clamp(currentTime.value / duration.value, 0, 1);
  });

  function syncFromElement() {
    currentTime.value = audio.currentTime;
    duration.value = Number.isFinite(audio.duration) ? audio.duration : 0;
    isReady.value = Number.isFinite(audio.duration) && audio.duration > 0;
  }

  function pause() {
    audio.pause();
  }

  async function play() {
    claimAudioPlayback(playerId, pause);
    try {
      await audio.play();
    } catch {
      hasError.value = true;
      isPlaying.value = false;
      releaseAudioPlayback(playerId);
    }
  }

  function togglePlayback() {
    if (isPlaying.value) {
      pause();
      return;
    }
    play().catch(() => undefined);
  }

  function seek(seconds: number) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = clamp(seconds, 0, audio.duration);
    syncFromElement();
  }

  function seekToProgress(ratio: number) {
    if (!duration.value) return;
    seek(duration.value * clamp(ratio, 0, 1));
  }

  audio.addEventListener("play", () => {
    isPlaying.value = true;
    hasError.value = false;
  });
  audio.addEventListener("pause", () => {
    isPlaying.value = false;
  });
  audio.addEventListener("ended", () => {
    isPlaying.value = false;
    releaseAudioPlayback(playerId);
    syncFromElement();
  });
  audio.addEventListener("timeupdate", syncFromElement);
  audio.addEventListener("loadedmetadata", syncFromElement);
  audio.addEventListener("durationchange", syncFromElement);
  audio.addEventListener("error", () => {
    hasError.value = true;
    isPlaying.value = false;
    releaseAudioPlayback(playerId);
  });

  watch(
    sourceUrl,
    (url) => {
      pause();
      isReady.value = false;
      hasError.value = false;
      currentTime.value = 0;
      duration.value = 0;
      audio.src = url;
      audio.load();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    pause();
    releaseAudioPlayback(playerId);
    audio.src = "";
  });

  return {
    isPlaying,
    currentTime,
    duration,
    progress,
    isReady,
    hasError,
    play,
    pause,
    togglePlayback,
    seek,
    seekToProgress,
  };
}
