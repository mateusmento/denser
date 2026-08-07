import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type E2eHarness } from "./harness.js";

describe("api skeleton", () => {
  let harness: E2eHarness;

  beforeAll(async () => {
    harness = await startHarness();
  }, 120_000);

  afterAll(async () => {
    await harness.stop();
  });

  it("health returns ok", async () => {
    const client = harness.createClient();
    await expect(client.health()).resolves.toEqual({ ok: true });
  });

  it("sign-in yields session user", async () => {
    const client = await harness.createAuthedClient("alice");
    const session = await client.session();
    expect(session.user?.id).toBeTruthy();
    expect(session.user?.name).toBe("Alice Chen");

    const me = await client.me();
    expect(me.user.name).toBe("Alice Chen");
  });
});
