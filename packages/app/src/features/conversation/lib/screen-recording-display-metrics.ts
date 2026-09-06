import type { CameraCircleLayout } from "./screen-recording-composite";

export type PreviewContentMetrics = {
  scale: number;
  offsetX: number;
  offsetY: number;
  contentWidth: number;
  contentHeight: number;
};

export function previewContentMetrics(
  displayWidth: number,
  displayHeight: number,
  frameWidth: number,
  frameHeight: number,
): PreviewContentMetrics | null {
  if (!displayWidth || !displayHeight || !frameWidth || !frameHeight) return null;
  const scale = Math.min(displayWidth / frameWidth, displayHeight / frameHeight);
  const contentWidth = frameWidth * scale;
  const contentHeight = frameHeight * scale;
  return {
    scale,
    offsetX: (displayWidth - contentWidth) / 2,
    offsetY: (displayHeight - contentHeight) / 2,
    contentWidth,
    contentHeight,
  };
}

export function cameraLayoutToDisplayRect(
  metrics: PreviewContentMetrics,
  layout: CameraCircleLayout,
) {
  return {
    left: metrics.offsetX + layout.x * metrics.scale,
    top: metrics.offsetY + layout.y * metrics.scale,
    size: layout.diameter * metrics.scale,
  };
}

export function displayTopLeftToCaptureLayout(
  displayX: number,
  displayY: number,
  diameter: number,
  metrics: PreviewContentMetrics,
): CameraCircleLayout {
  return {
    x: (displayX - metrics.offsetX) / metrics.scale,
    y: (displayY - metrics.offsetY) / metrics.scale,
    diameter,
  };
}
