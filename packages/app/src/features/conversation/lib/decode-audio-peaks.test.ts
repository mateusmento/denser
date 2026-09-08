import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUDIO_WAVEFORM_BAR_COUNT,
  samplePeaksFromChannelData,
} from "./decode-audio-peaks.js";

test("samplePeaksFromChannelData normalizes peaks to 0-1", () => {
  const channelData = new Float32Array([0, 0.5, -1, 0.25, 0, 0.75]);
  const peaks = samplePeaksFromChannelData(channelData, 3);
  assert.equal(peaks.length, 3);
  assert.ok(peaks.every((peak) => peak >= 0 && peak <= 1));
  assert.equal(peaks[1], 1);
});

test("samplePeaksFromChannelData returns fallback bars for empty input", () => {
  const peaks = samplePeaksFromChannelData(new Float32Array(), AUDIO_WAVEFORM_BAR_COUNT);
  assert.equal(peaks.length, AUDIO_WAVEFORM_BAR_COUNT);
  assert.ok(peaks.every((peak) => peak === 0.2));
});
