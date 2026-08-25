import { SEED_ARTIFACT_ONBOARDING_NOTES, SEED_SPACE_ACME, SEED_SPACE_ENGINEERING } from "@denser/contracts";
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

describe("domain api", () => {
  let harness: E2eHarness;

  beforeAll(async () => {
    harness = await startHarness();
  }, 120_000);

  afterAll(async () => {
    await harness.stop();
  });

  it("home lists seeded workspace for alice", async () => {
    const client = await harness.createAuthedClient("alice");
    const home = await client.home();

    expect(home.spaces.map((space) => space.title)).toContain("Acme");
    expect(home.artifacts.map((artifact) => artifact.title)).toContain("Personal notes");
  });

  it("loads and patches a seeded document with version", async () => {
    const client = await harness.createAuthedClient("alice");
    const { document } = await client.getDocument(SEED_ARTIFACT_ONBOARDING_NOTES);

    expect(document.title).toBe("Onboarding notes");
    expect(document.body.type).toBe("doc");

    const patched = await client.patchDocument(SEED_ARTIFACT_ONBOARDING_NOTES, {
      title: "Onboarding notes (edited)",
      version: document.version,
    });

    expect(patched.document.title).toBe("Onboarding notes (edited)");
    expect(patched.document.version).toBe(document.version + 1);
  });

  it("returns 409 when document version is stale", async () => {
    const client = await harness.createAuthedClient("alice");
    const { document } = await client.getDocument(SEED_ARTIFACT_ONBOARDING_NOTES);

    await expect(
      client.patchDocument(SEED_ARTIFACT_ONBOARDING_NOTES, {
        title: "Stale write",
        version: document.version - 1,
      }),
    ).rejects.toMatchObject({
      status: 409,
      conflict: {
        error: "conflict",
        document: expect.objectContaining({ id: SEED_ARTIFACT_ONBOARDING_NOTES }),
      },
    });
  });

  it("loads a space with nested children and artifacts", async () => {
    const client = await harness.createAuthedClient("alice");
    const acme = await client.getSpace(SEED_SPACE_ACME);

    expect(acme.space.title).toBe("Acme");
    expect(acme.space.visibility).toBe("private");
    expect(acme.canManage).toBe(true);
    expect(acme.members.some((member) => member.username === "alice")).toBe(true);
    expect(acme.childSpaces.map((space) => space.title)).toContain("Engineering");

    const engineering = await client.getSpace(SEED_SPACE_ENGINEERING);
    expect(engineering.space.visibility).toBe("public");
    expect(engineering.artifacts.map((artifact) => artifact.title)).toContain(
      "Onboarding notes (edited)",
    );
  });

  it("gates root spaces behind membership and shares public nested folders", async () => {
    const bobClient = await harness.createAuthedClient("bob");

    await expect(bobClient.getSpace(SEED_SPACE_ACME)).rejects.toMatchObject({ status: 404 });

    const aliceClient = await harness.createAuthedClient("alice");
    await aliceClient.addSpaceMember(SEED_SPACE_ACME, { username: "bob", role: "member" });

    const acmeForBob = await bobClient.getSpace(SEED_SPACE_ACME);
    expect(acmeForBob.members.some((member) => member.username === "bob")).toBe(true);

    const engineeringForBob = await bobClient.getSpace(SEED_SPACE_ENGINEERING);
    expect(engineeringForBob.space.visibility).toBe("public");
  });

  it("requires explicit membership for private nested spaces", async () => {
    const aliceClient = await harness.createAuthedClient("alice");
    const bobClient = await harness.createAuthedClient("bob");

    const { space: privateRoom } = await aliceClient.createSpace({
      title: "Leadership",
      parentSpaceId: SEED_SPACE_ACME,
      visibility: "private",
    });

    await expect(bobClient.getSpace(privateRoom.id)).rejects.toMatchObject({ status: 404 });

    await aliceClient.addSpaceMember(privateRoom.id, { username: "bob", role: "member" });
    const roomForBob = await bobClient.getSpace(privateRoom.id);
    expect(roomForBob.space.visibility).toBe("private");
  });
});
