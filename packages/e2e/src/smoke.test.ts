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

  it("deletes a document", async () => {
    const client = await harness.createAuthedClient("alice");
    const { document: created } = await client.createDocument({ title: "Delete me" });

    await client.deleteDocument(created.id);
    await expect(client.getDocument(created.id)).rejects.toMatchObject({ status: 404 });

    const home = await client.home();
    expect(home.artifacts.map((artifact) => artifact.id)).not.toContain(created.id);
  });

  it("duplicates and deletes a document", async () => {
    const client = await harness.createAuthedClient("alice");
    const { document: source } = await client.getDocument(SEED_ARTIFACT_ONBOARDING_NOTES);
    const { document: copy } = await client.duplicateDocument(SEED_ARTIFACT_ONBOARDING_NOTES);

    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toBe(`${source.title} copy`);
    expect(copy.spaceId).toBe(source.spaceId);
    expect(copy.body).toEqual(source.body);

    await client.deleteDocument(copy.id);
    await expect(client.getDocument(copy.id)).rejects.toMatchObject({ status: 404 });
  });

  it("creates, loads, patches, and deletes a conversation", async () => {
    const client = await harness.createAuthedClient("alice");
    const { conversation: created } = await client.createConversation({
      title: "Standup",
      spaceId: SEED_SPACE_ENGINEERING,
    });

    expect(created.kind).toBe("conversation");
    expect(created.conversationKind).toBe("regular");
    expect(created.title).toBe("Standup");

    const { conversation: loaded } = await client.getConversation(created.id);
    expect(loaded.id).toBe(created.id);
    expect(loaded.conversationKind).toBe("regular");

    const patched = await client.patchConversation(created.id, {
      title: "Daily standup",
      version: loaded.version,
    });
    expect(patched.conversation.title).toBe("Daily standup");

    const engineering = await client.getSpace(SEED_SPACE_ENGINEERING);
    expect(engineering.artifacts.map((artifact) => artifact.id)).toContain(created.id);

    await client.deleteConversation(created.id);
    await expect(client.getConversation(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("creates and dedupes direct conversations within a root space", async () => {
    const aliceClient = await harness.createAuthedClient("alice");
    const bobClient = await harness.createAuthedClient("bob");

    const acmeBefore = await aliceClient.getSpace(SEED_SPACE_ACME);
    if (!acmeBefore.members.some((member) => member.username === "bob")) {
      await aliceClient.addSpaceMember(SEED_SPACE_ACME, { username: "bob", role: "member" });
    }

    const first = await aliceClient.createOrOpenDirectConversation({
      rootSpaceId: SEED_SPACE_ACME,
      memberUsernames: ["bob"],
      spaceId: SEED_SPACE_ENGINEERING,
    });
    expect(first.created).toBe(true);
    expect(first.conversation.conversationKind).toBe("direct");
    expect(first.conversation.rootSpaceId).toBe(SEED_SPACE_ACME);

    const second = await aliceClient.createOrOpenDirectConversation({
      rootSpaceId: SEED_SPACE_ACME,
      memberUsernames: ["bob"],
    });
    expect(second.created).toBe(false);
    expect(second.conversation.id).toBe(first.conversation.id);

    const aliceDms = await aliceClient.listDirectConversations(SEED_SPACE_ACME);
    expect(aliceDms.conversations.map((conversation) => conversation.id)).toContain(
      first.conversation.id,
    );

    const bobDms = await bobClient.listDirectConversations(SEED_SPACE_ACME);
    expect(bobDms.conversations.map((conversation) => conversation.id)).toContain(
      first.conversation.id,
    );

    const engineering = await aliceClient.getSpace(SEED_SPACE_ENGINEERING);
    expect(engineering.artifacts.map((artifact) => artifact.id)).not.toContain(
      first.conversation.id,
    );
  });

  it("allows direct messages when the peer is a nested-space member only", async () => {
    const aliceClient = await harness.createAuthedClient("alice");
    const bobClient = await harness.createAuthedClient("bob");

    const { space: nestedOnlyRoom } = await aliceClient.createSpace({
      title: "Nested collaborators",
      parentSpaceId: SEED_SPACE_ACME,
      visibility: "public",
    });

    await aliceClient.addSpaceMember(nestedOnlyRoom.id, { username: "bob", role: "member" });

    const { conversation } = await aliceClient.createOrOpenDirectConversation({
      rootSpaceId: SEED_SPACE_ACME,
      memberUsernames: ["bob"],
      spaceId: nestedOnlyRoom.id,
    });

    expect(conversation.conversationKind).toBe("direct");
    await expect(bobClient.getConversation(conversation.id)).resolves.toMatchObject({
      conversation: expect.objectContaining({ id: conversation.id }),
    });
  });

  it("deletes a nested space", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space: copy } = await client.createSpace({
      title: "Engineering copy",
      parentSpaceId: SEED_SPACE_ACME,
    });

    const acme = await client.getSpace(SEED_SPACE_ACME);
    expect(acme.childSpaces.map((space) => space.id)).toContain(copy.id);

    await client.deleteSpace(copy.id);

    const acmeAfterDelete = await client.getSpace(SEED_SPACE_ACME);
    expect(acmeAfterDelete.childSpaces.map((space) => space.id)).not.toContain(copy.id);
  });

  it("creates public home folders and forbids making private spaces public", async () => {
    const aliceClient = await harness.createAuthedClient("alice");
    const bobClient = await harness.createAuthedClient("bob");

    const { space: folder } = await aliceClient.createSpace({ title: "Notes" });
    expect(folder.parentSpaceId).toBeNull();
    expect(folder.visibility).toBe("public");

    const aliceHome = await aliceClient.home();
    expect(aliceHome.spaces.map((space) => space.id)).toContain(folder.id);

    const bobHome = await bobClient.home();
    expect(bobHome.spaces.map((space) => space.id)).not.toContain(folder.id);
    await expect(bobClient.getSpace(folder.id)).rejects.toMatchObject({ status: 404 });

    const loaded = await aliceClient.getSpace(folder.id);
    expect(loaded.members).toEqual([]);
    expect(loaded.canManage).toBe(true);

    await expect(
      aliceClient.addSpaceMember(folder.id, { username: "bob", role: "member" }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(aliceClient.listDirectConversations(folder.id)).rejects.toMatchObject({
      status: 404,
    });

    const promoted = await aliceClient.patchSpace(folder.id, { visibility: "private" });
    expect(promoted.space.visibility).toBe("private");

    const afterPromote = await aliceClient.getSpace(folder.id);
    expect(
      afterPromote.members.some((member) => member.username === "alice" && member.role === "owner"),
    ).toBe(true);

    await expect(aliceClient.patchSpace(folder.id, { visibility: "public" })).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      aliceClient.patchSpace(SEED_SPACE_ACME, { visibility: "public" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("planning", () => {
  let harness: E2eHarness;

  beforeAll(async () => {
    harness = await startHarness();
  }, 120_000);

  afterAll(async () => {
    await harness.stop();
  });

  it("creates a Kanban project with backlog, board, and issue workflow", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space } = await client.createSpace({ title: "Launch", preset: "project" });

    expect(space.showBacklog).toBe(true);
    expect(space.showBoard).toBe(true);
    expect(space.sprintingEnabled).toBe(false);

    const detail = await client.getSpace(space.id);
    expect(detail.workflow?.name).toBe("Issue tracking");
    expect(detail.workflow?.stages.map((stage) => stage.name)).toEqual([
      "Todo",
      "In Progress",
      "In Review",
      "Done",
    ]);
    expect(detail.documentTypes.map((type) => type.key)).toEqual(["issue", "spec", "doc"]);

    const { document } = await client.createDocument({ title: "First issue", spaceId: space.id });
    expect(document.documentTypeKey).toBe("issue");
    expect(document.stageName).toBe("Todo");

    const todo = detail.workflow!.stages.find((stage) => stage.name === "Todo")!;
    const inReview = detail.workflow!.stages.find((stage) => stage.name === "In Review")!;
    const done = detail.workflow!.stages.find((stage) => stage.name === "Done")!;

    await expect(
      client.patchDocument(document.id, { stageId: done.id, version: document.version }),
    ).rejects.toMatchObject({ status: 400 });

    const reviewed = await client.patchDocument(document.id, {
      stageId: inReview.id,
      version: document.version,
    });
    expect(reviewed.document.stageName).toBe("In Review");

    const settled = await client.patchDocument(document.id, {
      stageId: done.id,
      version: reviewed.document.version,
    });
    expect(settled.document.stageName).toBe("Done");

    const listed = await client.getSpace(space.id);
    expect(listed.artifacts.some((artifact) => artifact.id === document.id && artifact.spaceId === space.id)).toBe(
      true,
    );
    expect(todo.name).toBe("Todo");
  });

  it("starts and completes a Scrum clock and moves documents between sprint spaces", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space } = await client.createSpace({ title: "Scrum launch", preset: "scrum" });

    expect(space.sprintingEnabled).toBe(true);
    expect(space.upcomingSprintId).toBeTruthy();
    expect(space.activeSprintId).toBeNull();

    const beforeStart = await client.getSpace(space.id);
    const upcoming = beforeStart.childSpaces.find((child) => child.id === space.upcomingSprintId);
    expect(upcoming?.title).toBe("Sprint 1");
    expect(upcoming?.sprintRole).toBe("upcoming");

    const { document } = await client.createDocument({
      title: "Planned work",
      spaceId: space.id,
    });
    const moved = await client.patchDocument(document.id, {
      spaceId: upcoming!.id,
      rank: 0,
      version: document.version,
    });
    expect(moved.document.spaceId).toBe(upcoming!.id);

    const started = await client.startSprint(space.id);
    expect(started.space.activeSprintId).toBe(upcoming!.id);
    expect(started.space.upcomingSprintId).not.toBe(upcoming!.id);
    expect(started.space.upcomingSprintId).toBeTruthy();

    const activeDetail = await client.getSpace(space.id);
    const activeChild = activeDetail.childSpaces.find((child) => child.id === started.space.activeSprintId);
    expect(activeChild?.sprintRole).toBe("active");
    expect(activeDetail.artifacts.some((artifact) => artifact.id === document.id)).toBe(true);

    const completed = await client.completeSprint(space.id);
    expect(completed.space.activeSprintId).toBeNull();
    expect(completed.space.upcomingSprintId).toBe(started.space.upcomingSprintId);

    const afterComplete = await client.getSpace(space.id);
    const past = afterComplete.childSpaces.find((child) => child.id === upcoming!.id);
    expect(past?.sprintRole).toBe("past");

    const leftover = await client.getDocument(document.id);
    expect(leftover.document.spaceId).toBe(upcoming!.id);
  });
});
