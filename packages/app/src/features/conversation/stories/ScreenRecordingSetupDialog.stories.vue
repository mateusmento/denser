<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import ScreenRecordingSetupDialog from "../presentationals/ScreenRecordingSetupDialog.vue";
import type { ScreenRecordingSetupView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ScreenRecordingSetupDialog",
  component: ScreenRecordingSetupDialog,
  tags: ["autodocs"],
});

const open = ref(true);

const setupView: ScreenRecordingSetupView = {
  phase: "setup",
  webcamEnabled: true,
  micEnabled: true,
  systemAudioEnabled: false,
  canStart: true,
  previewAspectRatio: 16 / 9,
  cameraLayout: { x: 24, y: 640, diameter: 180 },
  frameWidth: 1920,
  frameHeight: 1080,
};

const recordingView: ScreenRecordingSetupView = {
  ...setupView,
  phase: "recording",
  elapsedLabel: "0:42",
};

const acquiringView: ScreenRecordingSetupView = {
  ...setupView,
  phase: "acquiring",
  canStart: false,
};
</script>

<template>
  <Story as-child name="Setup">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="setupView"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>
  <Story as-child name="Recording">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="recordingView"
      :preview-canvas="null"
      @cancel="open = false"
      @stop="open = false"
    />
  </Story>
  <Story as-child name="Acquiring">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="acquiringView"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>
</template>
