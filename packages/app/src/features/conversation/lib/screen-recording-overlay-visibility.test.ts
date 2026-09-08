import assert from "node:assert/strict";
import { test } from "node:test";
import {
  shouldDrawWebcamOverlay,
  shouldShowWebcamEditor,
} from "./screen-recording-overlay-visibility.js";

const setupView = {
  phase: "setup" as const,
  showCameraOverlayEditor: true,
  overlayEditMode: false,
  webcamEnabled: true,
  webcamAvailable: true,
  screenEnabled: true,
  screenAvailable: true,
  micEnabled: true,
  systemAudioEnabled: false,
  mirrorCamera: false,
  canStart: true,
  showAvatarFallback: false,
  avatarInitials: "MM",
  avatarName: "Mateus",
  previewAspectRatio: 16 / 9,
  cameraLayout: { x: 24, y: 640, diameter: 180 },
  frameWidth: 1920,
  frameHeight: 1080,
  webcamDeviceId: null,
  micDeviceId: null,
  cameras: [],
  microphones: [],
};

test("shouldShowWebcamEditor is false when overlay editor is disabled", () => {
  assert.equal(
    shouldShowWebcamEditor({ ...setupView, showCameraOverlayEditor: false }, true),
    false,
  );
});

test("shouldShowWebcamEditor is false without layout metrics", () => {
  assert.equal(shouldShowWebcamEditor(setupView, false), false);
});

test("shouldShowWebcamEditor is true when screen and webcam are combined in setup", () => {
  assert.equal(shouldShowWebcamEditor(setupView, true), true);
});

test("shouldDrawWebcamOverlay requires both screen and webcam", () => {
  assert.equal(shouldDrawWebcamOverlay(false, true, true, true), false);
  assert.equal(shouldDrawWebcamOverlay(true, false, true, true), false);
  assert.equal(shouldDrawWebcamOverlay(true, true, false, true), false);
  assert.equal(shouldDrawWebcamOverlay(true, true, true, false), false);
  assert.equal(shouldDrawWebcamOverlay(true, true, true, true), true);
});

test("editor visibility follows combined overlay mode", () => {
  const view = { ...setupView, showCameraOverlayEditor: false };
  assert.equal(shouldShowWebcamEditor(view, true), false);
  assert.equal(shouldDrawWebcamOverlay(true, true, true, true), true);
});
