import type { ScreenRecordingSetupView } from "../types";

export function shouldShowWebcamEditor(
  view: Pick<ScreenRecordingSetupView, "webcamEnabled" | "webcamAvailable" | "phase">,
  hasMetrics: boolean,
): boolean {
  return (
    view.webcamEnabled &&
    view.webcamAvailable &&
    view.phase === "setup" &&
    hasMetrics
  );
}

export function shouldDrawWebcamOnCanvas(webcamEnabled: boolean, hasWebcamVideo: boolean): boolean {
  return webcamEnabled && hasWebcamVideo;
}
