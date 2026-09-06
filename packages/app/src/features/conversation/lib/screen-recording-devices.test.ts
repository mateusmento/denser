import assert from "node:assert/strict";
import { test } from "node:test";
import {
  microphoneAudioConstraints,
  streamNeedsDeviceSwitch,
  toRecordingDeviceOptions,
  webcamVideoConstraints,
} from "./screen-recording-devices.js";

test("toRecordingDeviceOptions skips blank ids and names unlabeled devices", () => {
  assert.deepEqual(
    toRecordingDeviceOptions(
      [
        { deviceId: "", label: "Hidden" },
        { deviceId: "cam-1", label: "  FaceTime HD Camera  " },
        { deviceId: "cam-2", label: "" },
      ],
      "Camera",
    ),
    [
      { deviceId: "cam-1", label: "FaceTime HD Camera" },
      { deviceId: "cam-2", label: "Camera 2" },
    ],
  );
});

test("webcamVideoConstraints pins an explicit camera id", () => {
  assert.deepEqual(webcamVideoConstraints("cam-usb"), {
    width: { ideal: 720 },
    height: { ideal: 720 },
    aspectRatio: { ideal: 1 },
    deviceId: { exact: "cam-usb" },
  });
});

test("webcamVideoConstraints omits deviceId for the default camera", () => {
  assert.equal("deviceId" in webcamVideoConstraints(null), false);
});

test("microphoneAudioConstraints uses the default device when none is selected", () => {
  assert.equal(microphoneAudioConstraints(null), true);
  assert.deepEqual(microphoneAudioConstraints("mic-usb"), { deviceId: { exact: "mic-usb" } });
});

test("streamNeedsDeviceSwitch acquires when missing and switches only on an explicit id", () => {
  assert.equal(streamNeedsDeviceSwitch(false, null, null), true);
  assert.equal(streamNeedsDeviceSwitch(true, "cam-1", null), false);
  assert.equal(streamNeedsDeviceSwitch(true, "cam-1", "cam-1"), false);
  assert.equal(streamNeedsDeviceSwitch(true, "cam-1", "cam-2"), true);
});
