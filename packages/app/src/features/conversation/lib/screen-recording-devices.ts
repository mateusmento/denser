import type { ScreenRecordingDeviceOption } from "../types";

const CAMERA_MIC_LABEL_PATTERN =
  /\b(webcam|facetime|usb video|integrated camera|hd camera|camera built-in)\b/i;

const WEBCAM_MODEL_LABEL_PATTERN = /\b(c270|c920|c922|c930|c615|brio|logitech hd pro)\b/i;

export function toRecordingDeviceOptions(
  devices: readonly Pick<MediaDeviceInfo, "deviceId" | "label">[],
  unnamedLabel: string,
): ScreenRecordingDeviceOption[] {
  return devices
    .filter((device) => device.deviceId !== "")
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label.trim() || `${unnamedLabel} ${index + 1}`,
    }));
}

/** True when an audio input is the mic bundled with a webcam, not a standalone microphone. */
export function isCameraBoundMicrophone(
  device: Pick<MediaDeviceInfo, "groupId" | "label" | "kind">,
  videoInputs: readonly MediaDeviceInfo[],
): boolean {
  if (device.kind !== "audioinput") return true;

  const label = device.label.trim();
  if (CAMERA_MIC_LABEL_PATTERN.test(label)) return true;
  if (WEBCAM_MODEL_LABEL_PATTERN.test(label)) return true;

  if (!device.groupId) return false;

  return videoInputs.some(
    (video) => video.kind === "videoinput" && video.groupId === device.groupId,
  );
}

/** Prefer standalone mics over camera-bound audio inputs. */
export function dedicatedMicrophoneDevices(
  audioInputs: readonly MediaDeviceInfo[],
  videoInputs: readonly MediaDeviceInfo[],
): MediaDeviceInfo[] {
  return audioInputs.filter(
    (device) => device.kind === "audioinput" && !isCameraBoundMicrophone(device, videoInputs),
  );
}

export function trackDeviceId(
  stream: MediaStream | null,
  kind: "audio" | "video",
): string | null {
  const track = kind === "video" ? stream?.getVideoTracks()[0] : stream?.getAudioTracks()[0];
  return track?.getSettings().deviceId ?? null;
}

export function streamNeedsDeviceSwitch(
  hasStream: boolean,
  currentDeviceId: string | null,
  selectedDeviceId: string | null,
): boolean {
  if (!hasStream) return true;
  if (!selectedDeviceId) return false;
  return currentDeviceId !== selectedDeviceId;
}

export function webcamVideoConstraints(deviceId?: string | null): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
  };
}

export function microphoneAudioConstraints(
  deviceId?: string | null,
): boolean | MediaTrackConstraints {
  if (!deviceId) return true;
  return { deviceId: { exact: deviceId } };
}
