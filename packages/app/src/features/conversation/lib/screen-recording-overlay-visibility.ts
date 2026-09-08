import type { ScreenRecordingSetupView } from "../types";

export function shouldShowWebcamEditor(
  view: Pick<ScreenRecordingSetupView, "showCameraOverlayEditor" | "phase" | "overlayEditMode">,
  hasMetrics: boolean,
): boolean {
  return (
    view.showCameraOverlayEditor &&
    view.phase === "setup" &&
    view.overlayEditMode &&
    hasMetrics
  );
}

export function shouldShowOverlayEditButton(
  view: Pick<ScreenRecordingSetupView, "showCameraOverlayEditor" | "phase" | "overlayEditMode">,
  hasMetrics: boolean,
): boolean {
  return (
    view.showCameraOverlayEditor &&
    view.phase === "setup" &&
    !view.overlayEditMode &&
    hasMetrics
  );
}

export function shouldDrawWebcamOverlay(
  webcamEnabled: boolean,
  hasWebcamVideo: boolean,
  screenEnabled: boolean,
  hasScreenVideo: boolean,
): boolean {
  return webcamEnabled && hasWebcamVideo && screenEnabled && hasScreenVideo;
}
