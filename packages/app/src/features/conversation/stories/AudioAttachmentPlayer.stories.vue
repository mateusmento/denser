<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import AudioAttachmentPlayer from "../presentationals/AudioAttachmentPlayer.vue";

const { Story } = defineMeta({
  title: "features/conversation/AudioAttachmentPlayer",
  component: AudioAttachmentPlayer,
  tags: ["autodocs"],
});

const sampleUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
</script>

<template>
  <Story as-child name="Default">
    <div class="rounded-xl border bg-card p-4">
      <AudioAttachmentPlayer
        player-id="story-audio-1"
        :url="sampleUrl"
        name="voice-note.webm"
      />
    </div>
  </Story>
</template>
