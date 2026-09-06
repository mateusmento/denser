import { clampCameraLayout, type CameraCircleLayout } from "./screen-recording-composite";

export type CameraResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export function resizeCameraLayout(
  handle: CameraResizeHandle,
  start: CameraCircleLayout,
  deltaCaptureX: number,
  deltaCaptureY: number,
  frameWidth: number,
  frameHeight: number,
): CameraCircleLayout {
  let { x, y } = start;

  const growX = handle.includes("e") ? deltaCaptureX : handle.includes("w") ? -deltaCaptureX : 0;
  const growY = handle.includes("s") ? deltaCaptureY : handle.includes("n") ? -deltaCaptureY : 0;
  const delta =
    handle === "e" || handle === "w"
      ? growX
      : handle === "n" || handle === "s"
        ? growY
        : Math.max(growX, growY);

  const nextDiameter = start.diameter + delta;
  const diameterDelta = nextDiameter - start.diameter;

  if (handle.includes("w")) x -= diameterDelta;
  if (handle.includes("n")) y -= diameterDelta;

  return clampCameraLayout({ x, y, diameter: nextDiameter }, frameWidth, frameHeight);
}
