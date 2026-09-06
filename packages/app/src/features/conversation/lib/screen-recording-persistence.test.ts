import assert from "node:assert/strict";
import { test } from "node:test";
import { createRecordingChunkSink } from "./screen-recording-persistence.js";

test("createRecordingChunkSink falls back to memory when OPFS is unavailable", async () => {
  const original = navigator.storage?.getDirectory;
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: undefined,
  });

  try {
    const sink = await createRecordingChunkSink("video/webm", "recording-test.webm");
    sink.append(new Blob(["part-a"], { type: "video/webm" }));
    sink.append(new Blob(["part-b"], { type: "video/webm" }));
    const file = await sink.finalize();

    assert.equal(file.name, "recording-test.webm");
    assert.equal(file.type, "video/webm");
    assert.ok(file.size > 0);
  } finally {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: original ? { getDirectory: original } : undefined,
    });
  }
});

test("createRecordingChunkSink abort clears memory fallback data", async () => {
  const original = navigator.storage?.getDirectory;
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: undefined,
  });

  try {
    const sink = await createRecordingChunkSink("video/webm", "recording-test.webm");
    sink.append(new Blob(["part-a"], { type: "video/webm" }));
    await sink.abort();
    await assert.rejects(() => sink.finalize(), /empty/i);
  } finally {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: original ? { getDirectory: original } : undefined,
    });
  }
});
