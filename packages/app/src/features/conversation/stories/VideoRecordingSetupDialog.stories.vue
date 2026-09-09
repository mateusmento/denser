<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { computed, ref } from "vue";
import VideoRecordingSetupDialog from "../presentationals/VideoRecordingSetupDialog.vue";
import { videoRecordingSetupView } from "./video-recording-fixtures";

const { Story } = defineMeta({
  title: "features/conversation/VideoRecordingSetupDialog",
  component: VideoRecordingSetupDialog,
  tags: ["autodocs"],
});

const open = ref(true);
const webcamEnabled = ref(true);
const screenEnabled = ref(false);
const micEnabled = ref(true);
const systemAudioEnabled = ref(false);
const mirrorCamera = ref(false);
const overlayEditMode = ref(false);
const webcamDeviceId = ref("cam-front");
const micDeviceId = ref("mic-built-in");

const setupView = computed(() =>
  videoRecordingSetupView({
    webcamEnabled: webcamEnabled.value,
    webcamAvailable: true,
    screenEnabled: screenEnabled.value,
    screenAvailable: screenEnabled.value,
    webcamDeviceId: webcamDeviceId.value,
    micEnabled: micEnabled.value,
    micDeviceId: micDeviceId.value,
    systemAudioEnabled: systemAudioEnabled.value,
    mirrorCamera: mirrorCamera.value,
    overlayEditMode: overlayEditMode.value,
    showCameraOverlayEditor: screenEnabled.value && webcamEnabled.value,
    showAvatarFallback: !webcamEnabled.value && !screenEnabled.value,
    canStart: webcamEnabled.value || screenEnabled.value,
  }),
);

const avatarView = computed(() =>
  videoRecordingSetupView({
    webcamEnabled: false,
    webcamAvailable: false,
    screenEnabled: false,
    screenAvailable: false,
    canStart: false,
    showAvatarFallback: true,
    avatarInitials: "MM",
    avatarName: "Mateus",
  }),
);

const recordingView = computed(() =>
  videoRecordingSetupView({
    phase: "recording",
    webcamEnabled: webcamEnabled.value,
    webcamAvailable: true,
    screenEnabled: screenEnabled.value,
    screenAvailable: screenEnabled.value,
    webcamDeviceId: webcamDeviceId.value,
    micEnabled: micEnabled.value,
    micDeviceId: micDeviceId.value,
    systemAudioEnabled: systemAudioEnabled.value,
    elapsedLabel: "0:42",
  }),
);
</script>

<template>
  <Story as-child name="Setup webcam on">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="setupView"
      :preview-canvas="null"
      @cancel="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:screen-enabled="screenEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
      @update:mirror-camera="mirrorCamera = $event"
      @update:overlay-edit-mode="overlayEditMode = $event"
      @update:webcam-device-id="webcamDeviceId = $event"
      @update:mic-device-id="micDeviceId = $event"
    />
  </Story>

  <Story as-child name="Avatar fallback">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="avatarView"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>

  <Story as-child name="Setup webcam off">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="videoRecordingSetupView({
        webcamEnabled: false,
        webcamAvailable: false,
        canStart: false,
        showAvatarFallback: true,
        avatarInitials: 'YO',
        avatarName: 'You',
      })"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>

  <Story as-child name="Toggle webcam overlay">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="setupView"
      :preview-canvas="null"
      @cancel="open = false"
      @update:webcam-enabled="webcamEnabled = $event"
      @update:screen-enabled="screenEnabled = $event"
      @update:mic-enabled="micEnabled = $event"
      @update:system-audio-enabled="systemAudioEnabled = $event"
      @update:mirror-camera="mirrorCamera = $event"
      @update:overlay-edit-mode="overlayEditMode = $event"
      @update:webcam-device-id="webcamDeviceId = $event"
      @update:mic-device-id="micDeviceId = $event"
    />
  </Story>

  <Story as-child name="Combined screen and webcam">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="videoRecordingSetupView({
        screenEnabled: true,
        screenAvailable: true,
        webcamEnabled: true,
        webcamAvailable: true,
        showCameraOverlayEditor: true,
        overlayEditMode: false,
      })"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>

  <Story as-child name="Combined overlay edit mode">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="videoRecordingSetupView({
        screenEnabled: true,
        screenAvailable: true,
        webcamEnabled: true,
        webcamAvailable: true,
        showCameraOverlayEditor: true,
        overlayEditMode: true,
      })"
      :preview-canvas="null"
      @cancel="open = false"
    />
  </Story>

  <Story as-child name="Recording">
    <VideoRecordingSetupDialog
      v-model:open="open"
      :view="recordingView"
      :preview-canvas="null"
      @cancel="open = false"
      @stop="open = false"
    />
  </Story>
</template>
