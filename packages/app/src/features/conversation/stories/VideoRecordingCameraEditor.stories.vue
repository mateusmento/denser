<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { computed, ref } from "vue";
import VideoRecordingCameraEditor from "../presentationals/VideoRecordingCameraEditor.vue";
import { videoRecordingSetupView } from "./video-recording-fixtures";

const { Story } = defineMeta({
  title: "features/conversation/VideoRecordingCameraEditor",
  component: VideoRecordingCameraEditor,
  tags: ["autodocs"],
});

const overlayEditMode = ref(false);

const combinedView = computed(() =>
  videoRecordingSetupView({
    screenEnabled: true,
    screenAvailable: true,
    showCameraOverlayEditor: true,
    overlayEditMode: overlayEditMode.value,
  }),
);
</script>

<template>
  <Story as-child name="Webcam overlay on">
    <div
      class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
      data-slot="video-recording-camera-editor-preview"
    >
      <VideoRecordingCameraEditor
        :view="videoRecordingSetupView({
          screenEnabled: true,
          screenAvailable: true,
          showCameraOverlayEditor: true,
          overlayEditMode: false,
        })"
        :preview-canvas="null"
        @update:overlay-edit-mode="overlayEditMode = $event"
      />
    </div>
  </Story>

  <Story as-child name="Webcam overlay edit mode">
    <div
      class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
      data-slot="video-recording-camera-editor-preview"
    >
      <VideoRecordingCameraEditor
        :view="videoRecordingSetupView({
          screenEnabled: true,
          screenAvailable: true,
          showCameraOverlayEditor: true,
          overlayEditMode: true,
        })"
        :preview-canvas="null"
        @update:overlay-edit-mode="overlayEditMode = $event"
      />
    </div>
  </Story>

  <Story as-child name="Webcam overlay off">
    <div
      class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
      data-slot="video-recording-camera-editor-preview"
    >
      <VideoRecordingCameraEditor
        :view="videoRecordingSetupView({
          webcamEnabled: false,
          showCameraOverlayEditor: false,
        })"
        :preview-canvas="null"
      />
    </div>
  </Story>

  <Story as-child name="Toggle overlay edit mode">
    <div class="flex flex-col gap-3">
      <label class="flex items-center gap-2 text-sm">
        <input v-model="overlayEditMode" type="checkbox" />
        Overlay edit mode
      </label>
      <div
        class="relative h-[360px] w-[640px] overflow-hidden rounded-lg border border-border bg-black/80"
        data-slot="video-recording-camera-editor-preview"
      >
        <VideoRecordingCameraEditor
          :view="combinedView"
          :preview-canvas="null"
          @update:overlay-edit-mode="overlayEditMode = $event"
        />
      </div>
    </div>
  </Story>
</template>
