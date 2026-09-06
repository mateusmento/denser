import assert from "node:assert/strict";
import { test } from "node:test";
import {
  shouldDrawWebcamOnCanvas,
  shouldShowWebcamEditor,
} from "./screen-recording-overlay-visibility.js";

const setupView = {
  phase: "setup" as const,
  webcamEnabled: true,
  webcamAvailable: true,
  micEnabled: true,
  systemAudioEnabled: false,
  canStart: true,
  previewAspectRatio: 16 / 9,
  cameraLayout: { x: 24, y: 640, diameter: 180 },
  frameWidth: 1920,
  frameHeight: 1080,
};

test("shouldShowWebcamEditor is false when webcam toggle is off", () => {
  assert.equal(
    shouldShowWebcamEditor({ ...setupView, webcamEnabled: false }, true),
    false,
  );
});

test("shouldShowWebcamEditor is false without layout metrics", () => {
  assert.equal(shouldShowWebcamEditor(setupView, false), false);
});

test("shouldShowWebcamEditor is true when webcam is on in setup", () => {
  assert.equal(shouldShowWebcamEditor(setupView, true), true);
});

test("shouldDrawWebcamOnCanvas follows webcam toggle", () => {
  assert.equal(shouldDrawWebcamOnCanvas(false, true), false);
  assert.equal(shouldDrawWebcamOnCanvas(true, false), false);
  assert.equal(shouldDrawWebcamOnCanvas(true, true), true);
});

test("editor and canvas visibility stay aligned when webcam is disabled", () => {
  const hasWebcam = true;
  const hasMetrics = true;
  const view = { ...setupView, webcamEnabled: false };

  assert.equal(shouldShowWebcamEditor(view, hasMetrics), false);
  assert.equal(shouldDrawWebcamOnCanvas(view.webcamEnabled, hasWebcam), false);
});
