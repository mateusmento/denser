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

const overlayEditMode = ref(false);

const combinedView = computed(() =>
  screenRecordingSetupView({
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
      data-slot="screen-recording-camera-editor-preview"
    >
      <ScreenRecordingCameraEditor
        :view="screenRecordingSetupView({
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
      data-slot="screen-recording-camera-editor-preview"
    >
      <ScreenRecordingCameraEditor
        :view="screenRecordingSetupView({
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
      data-slot="screen-recording-camera-editor-preview"
    >
      <ScreenRecordingCameraEditor
        :view="screenRecordingSetupView({
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
        data-slot="screen-recording-camera-editor-preview"
      >
        <ScreenRecordingCameraEditor
          :view="combinedView"
          :preview-canvas="null"
          @update:overlay-edit-mode="overlayEditMode = $event"
        />
      </div>
    </div>
  </Story>
</template>
