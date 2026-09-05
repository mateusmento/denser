import { SEED_ARTIFACT_CHAN_PRODUCT } from "@denser/contracts";
import type { MessageId } from "@denser/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type E2eHarness } from "./harness.js";

describe("conversation message pagination", () => {
  const quoteTargetFar = "00000000-0000-4000-8000-00000000060c" as MessageId;
  let harness: E2eHarness;

  beforeAll(async () => {
    harness = await startHarness();
  }, 120_000);

  afterAll(async () => {
    await harness.stop();
  });

  it("loads #product-design in pages of 20 with bidirectional cursors", async () => {
    const client = await harness.createAuthedClient("alice");

    const latest = await client.listMessages(SEED_ARTIFACT_CHAN_PRODUCT, { size: 20 });
    expect(latest.messages.length).toBe(20);
    expect(latest.nextCursor).toBeTruthy();
    expect(latest.prevCursor).toBeTruthy();

    const older = await client.listMessages(SEED_ARTIFACT_CHAN_PRODUCT, {
      size: 20,
      cursor: latest.nextCursor!,
      direction: "next",
    });
    expect(older.messages.length).toBe(20);
    expect(older.messages.at(-1)!.id).not.toBe(latest.messages[0]!.id);

    const newer = await client.listMessages(SEED_ARTIFACT_CHAN_PRODUCT, {
      size: 20,
      cursor: older.prevCursor!,
      direction: "prev",
    });
    expect(newer.messages.length).toBe(20);
  });

  it("loads around a far anchor for quote jump", async () => {
    const client = await harness.createAuthedClient("alice");

    const around = await client.listMessages(SEED_ARTIFACT_CHAN_PRODUCT, {
      size: 20,
      around: quoteTargetFar,
    });

    expect(around.messages.some((message) => message.id === quoteTargetFar)).toBe(
      true,
    );
    expect(around.nextCursor).toBeTruthy();
    expect(around.prevCursor).toBeTruthy();
  });
});
