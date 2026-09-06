<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { computed, ref } from "vue";
import ScreenRecordingCameraEditor from "../presentationals/ScreenRecordingCameraEditor.vue";
import { screenRecordingSetupView } from "./screen-recording-fixtures";

const { Story } = defineMeta({
  title: "features/conversation/ScreenRecordingCameraEditor",
  component: ScreenRecordingCameraEditor,
  tags: ["autodocs"],
});

const webcamEnabled = ref(true);

const view = computed(() =>
  screenRecordingSetupView({
    webcamEnabled: webcamEnabled.value,
    webcamAvailable: true,
  }),
);
</script>

<template>
  <Story as-child name="Webcam overlay on">
    <div
      class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
      data-slot="screen-recording-camera-editor-preview"
    >
      <ScreenRecordingCameraEditor :view="screenRecordingSetupView()" />
    </div>
  </Story>

  <Story as-child name="Webcam overlay off">
    <div
      class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
      data-slot="screen-recording-camera-editor-preview"
    >
      <ScreenRecordingCameraEditor
        :view="screenRecordingSetupView({ webcamEnabled: false })"
      />
    </div>
  </Story>

  <Story as-child name="Toggle webcam overlay">
    <div class="flex flex-col gap-3">
      <label class="flex items-center gap-2 text-sm">
        <input v-model="webcamEnabled" type="checkbox" />
        Webcam enabled
      </label>
      <div
        class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
        data-slot="screen-recording-camera-editor-preview"
      >
        <ScreenRecordingCameraEditor :view="view" />
      </div>
    </div>
  </Story>
</template>
