<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from "vue";
import { Button, Spinner } from "@denser/design-system";
import { PauseIcon, PlayIcon } from "@lucide/vue";
import { useAudioPlayer } from "../composables/useAudioPlayer";
import { decodeAudioPeaks } from "../lib/decode-audio-peaks";
import { formatAudioTime } from "../lib/format-audio-time";
import AudioWaveform from "./AudioWaveform.vue";

const props = defineProps<{
  playerId: string;
  url: string;
  name: string;
  disabled?: boolean;
}>();

const sourceUrl = toRef(props, "url");
const player = useAudioPlayer(props.playerId, sourceUrl);

const peaks = ref<number[]>([]);
const peaksLoading = ref(true);
const peaksError = ref(false);

const timeLabel = computed(() => {
  if (player.isPlaying.value || player.currentTime.value > 0) {
    return formatAudioTime(player.currentTime.value);
  }
  if (player.isReady.value) {
    return formatAudioTime(player.duration.value);
  }
  return "0:00";
});

async function loadPeaks(url: string) {
  peaksLoading.value = true;
  peaksError.value = false;
  try {
    peaks.value = await decodeAudioPeaks(url);
  } catch {
    peaksError.value = true;
    peaks.value = [];
  } finally {
    peaksLoading.value = false;
  }
}

onMounted(() => {
  loadPeaks(props.url).catch(() => undefined);
});

watch(
  () => props.url,
  (url) => {
    loadPeaks(url).catch(() => undefined);
  },
);

function onTogglePlayback() {
  if (props.disabled) return;
  player.togglePlayback();
}

function onWaveformSeek(progress: number) {
  if (props.disabled) return;
  player.seekToProgress(progress);
}
</script>

<template>
  <div
    data-slot="audio-attachment-player"
    role="group"
    class="flex w-[22rem] shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
    :aria-label="name"
  >
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      class="shrink-0"
      :disabled="disabled"
      :aria-pressed="player.isPlaying.value"
      :aria-label="player.isPlaying.value ? `Pause ${name}` : `Play ${name}`"
      @click="onTogglePlayback"
    >
      <PauseIcon v-if="player.isPlaying.value" class="size-3.5" />
      <PlayIcon v-else class="size-3.5" />
    </Button>

    <div class="relative flex min-w-0 flex-1 items-center gap-2">
      <Spinner
        v-if="peaksLoading"
        class="absolute inset-0 m-auto size-4 text-muted-foreground"
      />
      <AudioWaveform
        :peaks="peaks"
        :progress="player.progress.value"
        :disabled="disabled || peaksLoading || (!player.isReady.value && !player.isPlaying.value)"
        :ariaLabel="`Seek ${name}`"
        :class="peaksLoading ? 'opacity-0' : ''"
        @seek="onWaveformSeek"
      />
    </div>

    <span class="shrink-0 text-sm tabular-nums text-muted-foreground">
      {{ timeLabel }}
    </span>

    <span v-if="player.hasError.value || peaksError" class="sr-only">Audio failed to load</span>
  </div>
</template>
