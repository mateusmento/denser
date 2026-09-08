import assert from "node:assert/strict";
import { test } from "node:test";
import { formatAudioTime } from "./format-audio-time.js";

test("formatAudioTime formats minutes and zero-padded seconds", () => {
  assert.equal(formatAudioTime(0), "0:00");
  assert.equal(formatAudioTime(12), "0:12");
  assert.equal(formatAudioTime(65), "1:05");
  assert.equal(formatAudioTime(600), "10:00");
});

test("formatAudioTime handles invalid values", () => {
  assert.equal(formatAudioTime(-1), "0:00");
  assert.equal(formatAudioTime(Number.NaN), "0:00");
});
