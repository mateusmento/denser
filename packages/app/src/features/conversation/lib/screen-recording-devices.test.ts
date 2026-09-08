import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dedicatedMicrophoneDevices,
  isCameraBoundMicrophone,
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

test("dedicatedMicrophoneDevices excludes camera-bound audio inputs", () => {
  const videoInputs = [
    { deviceId: "cam-1", groupId: "group-cam", kind: "videoinput", label: "Webcam" },
  ] as MediaDeviceInfo[];
  const audioInputs = [
    { deviceId: "mic-1", groupId: "group-mic", kind: "audioinput", label: "Headset" },
    { deviceId: "cam-mic", groupId: "group-cam", kind: "audioinput", label: "Webcam Mono" },
  ] as MediaDeviceInfo[];

  assert.deepEqual(
    dedicatedMicrophoneDevices(audioInputs, videoInputs).map((device) => device.deviceId),
    ["mic-1"],
  );
});

test("dedicatedMicrophoneDevices excludes webcam mics by label when groupId is missing", () => {
  const videoInputs = [
    { deviceId: "cam-1", groupId: "", kind: "videoinput", label: "Webcam C270" },
  ] as MediaDeviceInfo[];
  const audioInputs = [
    {
      deviceId: "mic-1",
      groupId: "",
      kind: "audioinput",
      label: "HDA Intel PCH Analog Stereo",
    },
    {
      deviceId: "cam-mic",
      groupId: "",
      kind: "audioinput",
      label: "Webcam C270 Mono",
    },
  ] as MediaDeviceInfo[];

  assert.deepEqual(
    dedicatedMicrophoneDevices(audioInputs, videoInputs).map((device) => device.deviceId),
    ["mic-1"],
  );
});

test("isCameraBoundMicrophone matches common webcam model names", () => {
  assert.equal(
    isCameraBoundMicrophone(
      { kind: "audioinput", groupId: "", label: "Webcam C270 Mono" },
      [],
    ),
    true,
  );
});

test("dedicatedMicrophoneDevices returns empty when only camera mics exist", () => {
  const videoInputs = [
    { deviceId: "cam-1", groupId: "group-cam", kind: "videoinput", label: "Webcam" },
  ] as MediaDeviceInfo[];
  const audioInputs = [
    { deviceId: "cam-mic", groupId: "group-cam", kind: "audioinput", label: "Webcam Mono" },
  ] as MediaDeviceInfo[];

  assert.deepEqual(dedicatedMicrophoneDevices(audioInputs, videoInputs), []);
});
