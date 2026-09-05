/** Circular webcam layout in native capture pixel space (WYSIWYG with export canvas). */
export type CameraCircleLayout = {
  x: number;
  y: number;
  diameter: number;
};

const MIN_DIAMETER = 120;
const MAX_DIAMETER = 220;
const INSET_PX = 24;

export function defaultCameraLayout(frameWidth: number, frameHeight: number): CameraCircleLayout {
  const diameter = clamp(
    Math.round(Math.min(frameWidth, frameHeight) * 0.18),
    MIN_DIAMETER,
    MAX_DIAMETER,
  );
  return {
    x: INSET_PX,
    y: Math.max(INSET_PX, frameHeight - INSET_PX - diameter),
    diameter,
  };
}

export function clampCameraLayout(
  layout: CameraCircleLayout,
  frameWidth: number,
  frameHeight: number,
): CameraCircleLayout {
  const diameter = clamp(layout.diameter, MIN_DIAMETER, Math.min(MAX_DIAMETER, frameWidth, frameHeight));
  const maxX = Math.max(0, frameWidth - diameter);
  const maxY = Math.max(0, frameHeight - diameter);
  return {
    diameter,
    x: clamp(layout.x, 0, maxX),
    y: clamp(layout.y, 0, maxY),
  };
}

export function displayPointToCapture(
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number,
  frameWidth: number,
  frameHeight: number,
): { x: number; y: number } {
  const scaleX = frameWidth / displayWidth;
  const scaleY = frameHeight / displayHeight;
  return { x: displayX * scaleX, y: displayY * scaleY };
}

export function drawCompositeFrame(
  ctx: CanvasRenderingContext2D,
  screenVideo: CanvasImageSource,
  webcamVideo: CanvasImageSource | null,
  layout: CameraCircleLayout,
  frameWidth: number,
  frameHeight: number,
  webcamVisible: boolean,
) {
  ctx.clearRect(0, 0, frameWidth, frameHeight);
  ctx.drawImage(screenVideo, 0, 0, frameWidth, frameHeight);

  if (!webcamVisible || !webcamVideo) return;

  const { x, y, diameter } = layout;
  const radius = diameter / 2;
  const cx = x + radius;
  const cy = y + radius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(webcamVideo, x, y, diameter, diameter);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
