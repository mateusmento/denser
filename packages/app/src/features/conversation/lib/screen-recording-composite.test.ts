import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampCameraLayout,
  defaultCameraLayout,
  displayPointToCapture,
} from "./screen-recording-composite.js";
import { resizeCameraLayout } from "./screen-recording-resize.js";

test("resizeCameraLayout grows from south-east handle", () => {
  const start = { x: 24, y: 24, diameter: 160 };
  const next = resizeCameraLayout("se", start, 40, 40, 1920, 1080);
  assert.equal(next.x, 24);
  assert.equal(next.y, 24);
  assert.equal(next.diameter, 200);
});

test("defaultCameraLayout places circle bottom-left at 1080p", () => {
  const layout = defaultCameraLayout(1920, 1080);
  assert.equal(layout.diameter, 194);
  assert.equal(layout.x, 24);
  assert.equal(layout.y, 1080 - 24 - 194);
});

test("clampCameraLayout keeps circle inside frame", () => {
  const clamped = clampCameraLayout({ x: 9000, y: -50, diameter: 400 }, 800, 600);
  assert.equal(clamped.diameter, 210);
  assert.equal(clamped.x, 590);
  assert.equal(clamped.y, 0);
});

test("displayPointToCapture scales pointer coords", () => {
  const point = displayPointToCapture(100, 50, 400, 200, 1920, 1080);
  assert.equal(point.x, 480);
  assert.equal(point.y, 270);
});
