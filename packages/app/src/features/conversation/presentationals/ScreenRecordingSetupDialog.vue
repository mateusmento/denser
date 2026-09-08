<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Label,
  Spinner,
  Switch,
} from "@denser/design-system";
import {
  MicIcon,
  MicOffIcon,
  MonitorIcon,
  SettingsIcon,
  VideoIcon,
  VideoOffIcon,
} from "@lucide/vue";
import { nextTick, onUnmounted, useTemplateRef, watch } from "vue";
import type { CameraResizeHandle } from "../lib/screen-recording-resize";
import {
  createDisplayCanvas,
  mountPreviewCanvas,
  startPreviewMirror,
} from "../lib/screen-recording-preview-mount";
import ScreenRecordingCameraEditor from "./ScreenRecordingCameraEditor.vue";
import type { ScreenRecordingSetupView } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  view: ScreenRecordingSetupView;
  previewCanvas: HTMLCanvasElement | null;
}>();

const emit = defineEmits<{
  cancel: [];
  start: [];
  stop: [];
  minimize: [];
  "update:webcamEnabled": [value: boolean];
  "update:micEnabled": [value: boolean];
  "update:screenEnabled": [value: boolean];
  "update:systemAudioEnabled": [value: boolean];
  "update:mirrorCamera": [value: boolean];
  "update:overlayEditMode": [value: boolean];
  "update:webcamDeviceId": [value: string];
  "update:micDeviceId": [value: string];
  "move-camera": [payload: { displayX: number; displayY: number; displayWidth: number; displayHeight: number }];
  "resize-camera": [
    payload: {
      handle: CameraResizeHandle;
      deltaCaptureX: number;
      deltaCaptureY: number;
      baseLayout: ScreenRecordingSetupView["cameraLayout"];
    },
  ];
}>();

const previewCanvasMount = useTemplateRef<HTMLDivElement>("previewCanvasMount");
let stopMirror: (() => void) | null = null;

function teardownMirror() {
  stopMirror?.();
  stopMirror = null;
}

function clearPreviewCanvasMount() {
  previewCanvasMount.value?.replaceChildren();
}

watch(
  () => [open.value, props.previewCanvas, props.view.phase, props.view.showAvatarFallback] as const,
  ([isOpen, canvas, phase, showAvatar]) => {
    teardownMirror();
    clearPreviewCanvasMount();
    if (!isOpen || !canvas || showAvatar) return;

    nextTick(() => {
      const mount = previewCanvasMount.value;
      if (!mount || !canvas) return;

      if (phase === "setup") {
        mountPreviewCanvas(mount, canvas, "size-full object-contain");
        return;
      }

      if (phase === "recording" || phase === "finalizing") {
        const displayCanvas = createDisplayCanvas("size-full object-contain");
        mountPreviewCanvas(mount, displayCanvas, "size-full object-contain");
        stopMirror = startPreviewMirror(() => props.previewCanvas, displayCanvas);
      }
    });
  },
  { flush: "post", immediate: true },
);

onUnmounted(() => {
  teardownMirror();
  clearPreviewCanvasMount();
});

function onInteractOutside(event: Event) {
  const target = event.target;
  if (target instanceof Element && target.closest("[data-slot='dropdown-menu-content'], [data-slot='dropdown-menu-sub-content'], [data-slot='popover-content']")) {
    event.preventDefault();
    return;
  }
  if (props.view.phase === "recording" || props.view.phase === "finalizing") {
    event.preventDefault();
  }
}

function onEscapeKeydown(event: KeyboardEvent) {
  if (props.view.phase === "recording" || props.view.phase === "finalizing") {
    event.preventDefault();
  }
}

function toggleWebcam() {
  emit("update:webcamEnabled", !props.view.webcamEnabled);
}

function toggleMic() {
  emit("update:micEnabled", !props.view.micEnabled);
}

function toggleScreen() {
  emit("update:screenEnabled", !props.view.screenEnabled);
}

function onWebcamDeviceSelected(value: string) {
  emit("update:webcamDeviceId", value);
}

function onMicDeviceSelected(value: string) {
  emit("update:micDeviceId", value);
}

function previewControlClass(active: boolean) {
  return cn(
    "flex size-10 items-center justify-center rounded-full border shadow-sm transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-white/25 bg-black/55 text-white hover:bg-black/70",
  );
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[min(40rem,calc(100vh-2rem))] max-w-3xl flex-col gap-4 overflow-y-auto sm:max-w-3xl"
      data-slot="screen-recording-setup-dialog"
      :show-close-button="view.phase !== 'recording' && view.phase !== 'finalizing'"
      @pointer-down-outside="onInteractOutside"
      @interact-outside="onInteractOutside"
      @escape-key-down="onEscapeKeydown"
    >
      <DialogHeader>
        <DialogTitle>Record screen</DialogTitle>
        <DialogDescription>
          <template v-if="view.phase === 'recording'">
            Recording in progress. Minimize to use the floating controls while you present.
          </template>
          <template v-else>
            Turn on webcam or screen share, then record. The preview matches the exported video.
          </template>
        </DialogDescription>
      </DialogHeader>

      <p v-if="view.error" class="text-sm text-destructive">{{ view.error }}</p>

      <div
        class="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        :style="{ aspectRatio: String(view.previewAspectRatio) }"
      >
        <div class="relative flex size-full items-center justify-center bg-black/80">
          <div
            ref="previewCanvasMount"
            class="absolute inset-0"
            data-slot="screen-recording-preview-mount"
            aria-hidden="true"
          />

          <div
            v-if="view.showAvatarFallback"
            class="relative z-[1] flex flex-col items-center justify-center gap-2 text-muted-foreground"
            data-slot="screen-recording-avatar-fallback"
          >
            <Avatar class="size-24 border-2 border-border">
              <AvatarImage v-if="view.avatarUrl" :src="view.avatarUrl" :alt="view.avatarName" />
              <AvatarFallback class="text-2xl font-medium">{{ view.avatarInitials }}</AvatarFallback>
            </Avatar>
          </div>

          <ScreenRecordingCameraEditor
            :view="view"
            :preview-canvas="previewCanvas"
            @move-camera="emit('move-camera', $event)"
            @resize-camera="emit('resize-camera', $event)"
            @update:overlay-edit-mode="emit('update:overlayEditMode', $event)"
          />
        </div>

        <div
          v-if="view.phase === 'setup'"
          class="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center"
        >
          <div class="pointer-events-auto flex items-center gap-2 rounded-full bg-black/45 p-1.5 backdrop-blur-sm">
            <button
              type="button"
              data-slot="screen-recording-webcam-toggle"
              :class="previewControlClass(view.webcamEnabled)"
              :aria-pressed="view.webcamEnabled"
              aria-label="Webcam"
              @click="toggleWebcam"
            >
              <VideoIcon v-if="view.webcamEnabled" class="size-4" />
              <VideoOffIcon v-else class="size-4" />
            </button>

            <button
              type="button"
              data-slot="screen-recording-mic-toggle"
              :class="previewControlClass(view.micEnabled)"
              :aria-pressed="view.micEnabled"
              aria-label="Microphone"
              @click="toggleMic"
            >
              <MicIcon v-if="view.micEnabled" class="size-4" />
              <MicOffIcon v-else class="size-4" />
            </button>

            <button
              type="button"
              data-slot="screen-recording-screen-toggle"
              :class="previewControlClass(view.screenEnabled)"
              :aria-pressed="view.screenEnabled"
              aria-label="Screen share"
              @click="toggleScreen"
            >
              <MonitorIcon v-if="view.screenEnabled" class="size-4" />
              <MonitorIcon v-else class="size-4 opacity-70" />
            </button>

            <DropdownMenu :modal="false">
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  data-slot="screen-recording-settings-trigger"
                  :class="previewControlClass(false)"
                  aria-label="Recording settings"
                >
                  <SettingsIcon class="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" class="w-64" side="top">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger :disabled="view.cameras.length === 0">
                    Camera
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Camera devices</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      :model-value="view.webcamDeviceId ?? undefined"
                      @update:model-value="onWebcamDeviceSelected(String($event))"
                    >
                      <DropdownMenuRadioItem
                        v-for="camera in view.cameras"
                        :key="camera.deviceId"
                        :value="camera.deviceId"
                      >
                        {{ camera.label }}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger :disabled="view.microphones.length === 0">
                    Microphone
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Microphone devices</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      :model-value="view.micDeviceId ?? undefined"
                      @update:model-value="onMicDeviceSelected(String($event))"
                    >
                      <DropdownMenuRadioItem
                        v-for="microphone in view.microphones"
                        :key="microphone.deviceId"
                        :value="microphone.deviceId"
                      >
                        {{ microphone.label }}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <template v-if="view.screenEnabled">
                  <DropdownMenuSeparator />
                  <div class="flex items-center justify-between gap-2 px-2 py-1.5">
                    <Label for="sr-system-audio" class="text-sm">System audio</Label>
                    <Switch
                      id="sr-system-audio"
                      :model-value="view.systemAudioEnabled"
                      @update:model-value="emit('update:systemAudioEnabled', $event)"
                    />
                  </div>
                </template>

                <DropdownMenuSeparator />
                <div class="flex items-center justify-between gap-2 px-2 py-1.5">
                  <Label for="sr-mirror-camera" class="text-sm">Mirror camera</Label>
                  <Switch
                    id="sr-mirror-camera"
                    :model-value="view.mirrorCamera"
                    @update:model-value="emit('update:mirrorCamera', $event)"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          v-if="view.phase === 'acquiring'"
          class="absolute inset-0 flex items-center justify-center bg-background/60"
          data-slot="screen-recording-acquiring"
        >
          <Spinner class="size-8" />
          <span class="sr-only">Starting camera</span>
        </div>

        <div
          v-if="view.phase === 'finalizing'"
          class="absolute inset-0 flex items-center justify-center bg-background/60"
        >
          <Spinner class="size-8" />
          <span class="sr-only">Processing</span>
        </div>

        <div
          v-if="view.phase === 'recording'"
          class="absolute start-3 top-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground"
        >
          <span class="size-2 animate-pulse rounded-full bg-white" />
          {{ view.elapsedLabel }}
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-between">
        <Button
          v-if="view.phase !== 'recording'"
          variant="ghost"
          @click="emit('cancel')"
        >
          Cancel
        </Button>
        <div v-else />

        <div class="flex gap-2">
          <Button
            v-if="view.phase === 'setup'"
            :disabled="!view.canStart"
            @click="emit('start')"
          >
            Start recording
          </Button>
          <template v-else-if="view.phase === 'recording'">
            <Button variant="outline" @click="emit('minimize')">Minimize</Button>
            <Button variant="destructive" @click="emit('stop')">Stop</Button>
          </template>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
