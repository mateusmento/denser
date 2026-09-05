import { toast } from "@denser/design-system";
import { ref, watch } from "vue";
import { recordingFilename } from "../lib/screen-recording-capture";
import { useScreenRecordingSetup } from "./useScreenRecordingSetup";

export function useMessageComposerScreenRecording(options: {
  stageFiles: (files: readonly File[]) => void;
  disabled?: () => boolean;
}) {
  const open = ref(false);
  const setup = useScreenRecordingSetup();

  watch(open, (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
      void setup.begin();
    }
    if (!isOpen && wasOpen && setup.phase.value !== "idle") {
      setup.cancel();
    }
  });

  function openDialog() {
    if (options.disabled?.()) return;
    open.value = true;
  }

  async function onCancel() {
    setup.cancel();
    open.value = false;
  }

  async function onStart() {
    await setup.startRecording();
  }

  async function onStop() {
    const blob = await setup.stopRecording();
    open.value = false;
    if (!blob || blob.size === 0) {
      toast("Recording failed");
      return;
    }
    const mimeType = blob.type || "video/webm";
    const file = new File([blob], recordingFilename(mimeType), { type: mimeType });
    options.stageFiles([file]);
  }

  function onMoveCamera(payload: {
    displayX: number;
    displayY: number;
    displayWidth: number;
    displayHeight: number;
  }) {
    const { cameraLayout, frameWidth, frameHeight } = setup.view.value;
    const scale = Math.min(payload.displayWidth / frameWidth, payload.displayHeight / frameHeight);
    const contentWidth = frameWidth * scale;
    const contentHeight = frameHeight * scale;
    const offsetX = (payload.displayWidth - contentWidth) / 2;
    const offsetY = (payload.displayHeight - contentHeight) / 2;
    setup.setCameraLayout({
      x: (payload.displayX - offsetX) / scale,
      y: (payload.displayY - offsetY) / scale,
      diameter: cameraLayout.diameter,
    });
  }

  return {
    open,
    openDialog,
    setupView: setup.view,
    previewCanvas: setup.previewCanvas,
    onCancel,
    onStart,
    onStop,
    onMoveCamera,
    webcamEnabled: setup.webcamEnabled,
    micEnabled: setup.micEnabled,
    systemAudioEnabled: setup.systemAudioEnabled,
  };
}
