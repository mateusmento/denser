import type { ScreenRecordingSetupView } from "../types";

export function screenRecordingSetupView(
  overrides: Partial<ScreenRecordingSetupView> = {},
): ScreenRecordingSetupView {
  return {
    phase: "setup",
    webcamEnabled: true,
    webcamAvailable: true,
    micEnabled: true,
    systemAudioEnabled: false,
    canStart: true,
    previewAspectRatio: 16 / 9,
    cameraLayout: { x: 24, y: 640, diameter: 180 },
    frameWidth: 1920,
    frameHeight: 1080,
    ...overrides,
  };
}
