import assert from "node:assert/strict";
import test from "node:test";
import { patchWithVersionRetry } from "./patch-with-version-retry.js";

test("patchWithVersionRetry returns the first successful patch", async () => {
  const result = await patchWithVersionRetry({
    version: 1,
    patch: async (version) => ({ version, ok: true }),
    onConflict: () => null,
  });

  assert.deepEqual(result, { version: 1, ok: true });
});

test("patchWithVersionRetry retries once after a version conflict", async () => {
  let calls = 0;

  const result = await patchWithVersionRetry({
    version: 1,
    patch: async (version) => {
      calls += 1;
      if (version === 1) throw new Error("conflict");
      return { version, ok: true };
    },
    onConflict: (error) => (error instanceof Error && error.message === "conflict" ? 2 : null),
  });

  assert.equal(calls, 2);
  assert.deepEqual(result, { version: 2, ok: true });
});

test("patchWithVersionRetry stops after maxAttempts and calls onFailure", async () => {
  let failures = 0;

  const result = await patchWithVersionRetry({
    version: 1,
    maxAttempts: 2,
    patch: async () => {
      throw new Error("conflict");
    },
    onConflict: () => 2,
    onFailure: () => {
      failures += 1;
    },
  });

  assert.equal(result, null);
  assert.equal(failures, 1);
});

test("patchWithVersionRetry calls onFailure for non-conflict errors", async () => {
  let failures = 0;
  const boom = new Error("network");

  const result = await patchWithVersionRetry({
    version: 1,
    patch: async () => {
      throw boom;
    },
    onConflict: () => null,
    onFailure: (error) => {
      failures += 1;
      assert.equal(error, boom);
    },
  });

  assert.equal(result, null);
  assert.equal(failures, 1);
});
