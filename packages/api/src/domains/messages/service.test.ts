import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ArtifactId,
  ClientId,
  MessageDto,
  MessageId,
  PostMessageInput,
  SpaceId,
  UserId,
} from "@denser/contracts";
import type { MessageAccess, MessageServiceDeps } from "./service.js";
import { createMessageService } from "./service.js";
import { createInMemoryMessageRepository } from "./testing.js";

type Harness = {
  service: ReturnType<typeof createMessageService>;
  state: ReturnType<typeof createInMemoryMessageRepository>["state"];
  emitted: { event: "created" | "updated" | "deleted"; message: MessageDto }[];
};

const CONVERSATION = "00000000-0000-4000-8000-000000000001" as ArtifactId;
const SPACE = "00000000-0000-4000-8000-000000000003" as SpaceId;
const ALICE = "00000000-0000-4000-8000-00000000000a" as UserId;
const BOB = "00000000-0000-4000-8000-00000000000b" as UserId;
const CLIENT = "00000000-0000-4000-8000-0000000000c1" as ClientId;
const MISSING = "deadbeef-0000-4000-8000-000000000000" as MessageId;

function body(text: string): unknown {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

function textOf(message: MessageDto): unknown {
  const bodyRecord = message.body as { content?: { content?: { text?: unknown }[] }[] } | null;
  return bodyRecord?.content?.[0]?.content?.[0]?.text;
}

function postInput(overrides: Partial<PostMessageInput> = {}): PostMessageInput {
  return { conversationId: CONVERSATION, clientId: CLIENT, body: body("hi"), ...overrides };
}

function makeHarness(opts: { forbidBob?: boolean } = {}): Harness {
  const { repo, state } = createInMemoryMessageRepository();
  const emitted: Harness["emitted"] = [];

  const access: MessageAccess = async (_userId, conversationId) => {
    if (opts.forbidBob) return null;
    return { conversationId, rootSpaceId: SPACE };
  };

  const deps: MessageServiceDeps = {
    repo,
    access,
    attachments: {
      commitSync: async () => undefined,
    },
    emit: (_conversationId, event, message) => emitted.push({ event, message }),
  };

  return { service: createMessageService(deps), state, emitted };
}

async function seed(service: Harness["service"], count: number): Promise<MessageId[]> {
  const ids: MessageId[] = [];
  for (let i = 0; i < count; i += 1) {
    const result = await service.postMessage(ALICE, {
      ...postInput(),
      clientId: `client-${i}` as ClientId,
      body: body(`m${i}`),
    });
    if (result.ok) ids.push(result.message.id);
  }
  return ids;
}

test("list: returns most recent window by default", async () => {
  const h = makeHarness();
  await seed(h.service, 25);

  const result = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.messages.length, 20);
  assert.equal(textOf(result.messages[0]!), "m5");
  assert.equal(textOf(result.messages[19]!), "m24");
  assert.ok(result.nextCursor);
  assert.ok(result.prevCursor);
});

test("list: next walks backward, prev walks forward, around anchors", async () => {
  const h = makeHarness();
  const ids = await seed(h.service, 7);

  const page = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 2,
  });
  assert.equal(page.ok, true);
  if (!page.ok) return;
  assert.deepEqual(page.messages.map(textOf), ["m5", "m6"]);

  const next = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 2,
    cursor: page.nextCursor ?? undefined,
    direction: "next",
  });
  assert.equal(next.ok, true);
  if (!next.ok) return;
  assert.deepEqual(next.messages.map(textOf), ["m3", "m4"]);

  const prev = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 2,
    cursor: next.prevCursor ?? undefined,
    direction: "prev",
  });
  assert.equal(prev.ok, true);
  if (!prev.ok) return;
  assert.deepEqual(prev.messages.map(textOf), ["m5", "m6"]);

  const around = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 3,
    around: ids[3],
  });
  assert.equal(around.ok, true);
  if (!around.ok) return;
  assert.deepEqual(around.messages.map(textOf), ["m2", "m3", "m4"]);
});

test("list: around falls back when anchor is missing or foreign", async () => {
  const h = makeHarness();
  await seed(h.service, 4);

  const missing = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 3,
    around: MISSING,
  });
  assert.equal(missing.ok, true);
  if (!missing.ok) return;
  assert.deepEqual(missing.messages.map(textOf), ["m1", "m2", "m3"]);

  const foreign = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    size: 3,
    around: MISSING,
  });
  assert.equal(foreign.ok, true);
});

test("list: invalid cursor rejected", async () => {
  const h = makeHarness();
  const result = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
    cursor: "not-a-cursor",
  });
  assert.deepEqual(result, { ok: false, reason: "invalid_cursor" });
});

test("list: access is required", async () => {
  const h = makeHarness({ forbidBob: true });
  const result = await h.service.listMessagesForConversation(BOB, {
    conversationId: CONVERSATION,
  });
  assert.deepEqual(result, { ok: false, reason: "not_found" });
});

test("post: happy path persists, emits, and returns a dto", async () => {
  const h = makeHarness();
  const result = await h.service.postMessage(ALICE, postInput());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.message.id);
  assert.equal(result.message.authorId, ALICE);
  assert.equal(result.message.conversationId, CONVERSATION);
  assert.equal(result.message.clientId, CLIENT);

  const listed = await h.service.listMessagesForConversation(ALICE, {
    conversationId: CONVERSATION,
  });
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.equal(listed.messages.length, 1);
  assert.equal(h.emitted.length, 1);
  assert.equal(h.emitted[0]!.event, "created");
});

test("post: same clientId is idempotent", async () => {
  const h = makeHarness();
  const first = await h.service.postMessage(ALICE, postInput());
  const second = await h.service.postMessage(ALICE, postInput());
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.message.id, second.message.id);
  assert.equal(h.emitted.length, 1);
});

test("post: empty body and no attachments is invalid", async () => {
  const h = makeHarness();
  const result = await h.service.postMessage(ALICE, postInput({ body: { type: "doc", content: [] } }));
  assert.deepEqual(result, { ok: false, reason: "invalid_message" });
});

test("post: access gates before validation", async () => {
  const h = makeHarness({ forbidBob: true });
  const result = await h.service.postMessage(BOB, postInput());
  assert.deepEqual(result, { ok: false, reason: "not_found" });
});

test("edit: author can edit, others are forbidden", async () => {
  const h = makeHarness();
  const created = await h.service.postMessage(ALICE, postInput());
  if (!created.ok) return;

  const forb = await h.service.editMessage(BOB, created.message.id, body("mine"));
  assert.deepEqual(forb, { ok: false, reason: "forbidden" });

  const edited = await h.service.editMessage(ALICE, created.message.id, body("edited"));
  assert.equal(edited.ok, true);
  if (!edited.ok) return;
  assert.equal(textOf(edited.message), "edited");
  assert.ok(edited.message.editedAt);
  assert.equal(h.emitted.at(-1)?.event, "updated");
});

test("edit: empty body is forbidden", async () => {
  const h = makeHarness();
  const created = await h.service.postMessage(ALICE, postInput());
  if (!created.ok) return;
  const result = await h.service.editMessage(ALICE, created.message.id, {
    type: "doc",
    content: [],
  });
  assert.deepEqual(result, { ok: false, reason: "forbidden" });
});

test("delete: author can soft-delete, others are forbidden", async () => {
  const h = makeHarness();
  const created = await h.service.postMessage(ALICE, postInput());
  if (!created.ok) return;

  const forb = await h.service.deleteMessage(BOB, created.message.id);
  assert.deepEqual(forb, { ok: false, reason: "forbidden" });

  const deleted = await h.service.deleteMessage(ALICE, created.message.id);
  assert.equal(deleted.ok, true);
  if (!deleted.ok) return;
  assert.ok(deleted.message.deletedAt);
  assert.equal(h.emitted.at(-1)?.event, "deleted");

  const again = await h.service.deleteMessage(ALICE, created.message.id);
  assert.deepEqual(again, { ok: false, reason: "not_found" });
});

test("missing message id is not_found for edit/delete", async () => {
  const h = makeHarness();
  assert.deepEqual(await h.service.editMessage(ALICE, MISSING, body("x")), {
    ok: false,
    reason: "not_found",
  });
  assert.deepEqual(await h.service.deleteMessage(ALICE, MISSING), {
    ok: false,
    reason: "not_found",
  });
});