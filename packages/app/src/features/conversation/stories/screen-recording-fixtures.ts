import type { ScreenRecordingSetupView } from "../types";

export function screenRecordingSetupView(
  overrides: Partial<ScreenRecordingSetupView> = {},
): ScreenRecordingSetupView {
  return {
    phase: "setup",
    webcamEnabled: true,
    webcamAvailable: true,
    webcamDeviceId: "cam-front",
    micEnabled: true,
    micDeviceId: "mic-built-in",
    systemAudioEnabled: false,
    cameras: [
      { deviceId: "cam-front", label: "FaceTime HD Camera" },
      { deviceId: "cam-usb", label: "USB Webcam" },
    ],
    microphones: [
      { deviceId: "mic-built-in", label: "MacBook Pro Microphone" },
      { deviceId: "mic-usb", label: "USB Microphone" },
    ],
    canStart: true,
    previewAspectRatio: 16 / 9,
    cameraLayout: { x: 24, y: 640, diameter: 180 },
    frameWidth: 1920,
    frameHeight: 1080,
    ...overrides,
  };
}
