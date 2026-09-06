/** Circular webcam layout in native capture pixel space (WYSIWYG with export canvas). */
export type CameraCircleLayout = {
  x: number;
  y: number;
  diameter: number;
};

const MIN_DIAMETER_FRACTION = 0.06;
const MAX_DIAMETER_FRACTION = 0.35;
const DEFAULT_DIAMETER_FRACTION = 0.18;
const INSET_PX = 24;
const ABSOLUTE_MIN_DIAMETER = 80;

export function cameraDiameterBounds(frameWidth: number, frameHeight: number) {
  const base = Math.min(frameWidth, frameHeight);
  return {
    min: Math.max(ABSOLUTE_MIN_DIAMETER, Math.round(base * MIN_DIAMETER_FRACTION)),
    max: Math.round(base * MAX_DIAMETER_FRACTION),
  };
}

export function defaultCameraLayout(frameWidth: number, frameHeight: number): CameraCircleLayout {
  const { min, max } = cameraDiameterBounds(frameWidth, frameHeight);
  const diameter = clamp(
    Math.round(Math.min(frameWidth, frameHeight) * DEFAULT_DIAMETER_FRACTION),
    min,
    max,
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
  const { min, max } = cameraDiameterBounds(frameWidth, frameHeight);
  const diameter = clamp(layout.diameter, min, Math.min(max, frameWidth, frameHeight));
  const maxX = Math.max(0, frameWidth - diameter);
  const maxY = Math.max(0, frameHeight - diameter);
  return {
    diameter,
    x: clamp(layout.x, 0, maxX),
    y: clamp(layout.y, 0, maxY),
  };
}

export function readVideoIntrinsicSize(
  video: CanvasImageSource,
  fallbackWidth: number,
  fallbackHeight: number,
): { width: number; height: number } {
  const element = video as HTMLVideoElement;
  const width = element.videoWidth || fallbackWidth;
  const height = element.videoHeight || fallbackHeight;
  return { width, height };
}

export function canDrawVideoFrame(video: CanvasImageSource): boolean {
  const element = video as HTMLVideoElement;
  return (
    element.videoWidth > 0 &&
    element.videoHeight > 0 &&
    element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  );
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const { width: sourceWidth, height: sourceHeight } = readVideoIntrinsicSize(image, width, height);
  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
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
  if (!canDrawVideoFrame(screenVideo)) return;

  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  if (!canvasWidth || !canvasHeight) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight);

  if (!webcamVisible || !webcamVideo || !canDrawVideoFrame(webcamVideo)) return;

  const { x, y, diameter } = layout;
  const radius = diameter / 2;
  const cx = x + radius;
  const cy = y + radius;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  drawImageCover(ctx, webcamVideo, x, y, diameter, diameter);
  ctx.restore();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
