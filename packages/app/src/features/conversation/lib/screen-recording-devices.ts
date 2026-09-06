import type { ScreenRecordingDeviceOption } from "../types";

const SQUARE_WEBCAM_IDEAL_PX = 720;

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
    width: { ideal: SQUARE_WEBCAM_IDEAL_PX },
    height: { ideal: SQUARE_WEBCAM_IDEAL_PX },
    aspectRatio: { ideal: 1 },
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
  };
}

export function microphoneAudioConstraints(
  deviceId?: string | null,
): boolean | MediaTrackConstraints {
  if (!deviceId) return true;
  return { deviceId: { exact: deviceId } };
}
