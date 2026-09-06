<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { computed, ref } from "vue";
import ScreenRecordingSetupDialog from "../presentationals/ScreenRecordingSetupDialog.vue";
import { screenRecordingSetupView } from "./screen-recording-fixtures";

const { Story } = defineMeta({
  title: "features/conversation/ScreenRecordingSetupDialog",
  component: ScreenRecordingSetupDialog,
  tags: ["autodocs"],
});

const open = ref(true);
const webcamEnabled = ref(true);
const micEnabled = ref(true);
const systemAudioEnabled = ref(false);

const setupView = computed(() =>
  screenRecordingSetupView({
    webcamEnabled: webcamEnabled.value,
    webcamAvailable: true,
    micEnabled: micEnabled.value,
    systemAudioEnabled: systemAudioEnabled.value,
  }),
);

const recordingView = computed(() =>
  screenRecordingSetupView({
    phase: "recording",
    webcamEnabled: webcamEnabled.value,
    webcamAvailable: true,
    micEnabled: micEnabled.value,
    systemAudioEnabled: systemAudioEnabled.value,
    elapsedLabel: "0:42",
  }),
);
</script>

<template>
  <Story as-child name="Setup webcam on">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="setupView"
      :preview-canvas="null"
      @cancel="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
    />
  </Story>

  <Story as-child name="Setup webcam off">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="screenRecordingSetupView({ webcamEnabled: false })"
      :preview-canvas="null"
      @cancel="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
    />
  </Story>

  <Story as-child name="Toggle webcam overlay">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="setupView"
      :preview-canvas="null"
      @cancel="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
    />
  </Story>

  <Story as-child name="Recording">
    <ScreenRecordingSetupDialog
      v-model:open="open"
      :view="recordingView"
      :preview-canvas="null"
      @cancel="open = false"
      @stop="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
    />
  </Story>
</template>
