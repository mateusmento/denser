import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, MessageId, PollOptionId, UserId } from "@denser/contracts";
import { createPollService } from "./service.js";
import { createInMemoryPollRepository } from "./testing.js";

const CONVERSATION = "00000000-0000-4000-8000-000000000001" as ArtifactId;
const MESSAGE = "00000000-0000-4000-8000-000000000010" as MessageId;
const ALICE = "00000000-0000-4000-8000-00000000000a" as UserId;
const BOB = "00000000-0000-4000-8000-00000000000b" as UserId;

function makeHarness() {
  const { repo, seedMessage, options } = createInMemoryPollRepository();
  seedMessage(MESSAGE, CONVERSATION);
  const service = createPollService({ repo, access: async () => true });
  return { service, options };
}

test("createPollForMessage stores options in order", async () => {
  const h = makeHarness();
  const poll = await h.service.createPollForMessage(MESSAGE, { question: "Lunch?", options: ["Pizza", "Salad"] }, ALICE);
  assert.equal(poll.question, "Lunch?");
  assert.equal(poll.options.length, 2);
  const pizza = poll.options[0];
  assert.ok(pizza);
  assert.equal(pizza.label, "Pizza");
  assert.equal(poll.totalVotes, 0);
});

test("votePoll records vote and allows changing vote", async () => {
  const h = makeHarness();
  const poll = await h.service.createPollForMessage(MESSAGE, { question: "Go?", options: ["Yes", "No"] }, ALICE);
  const yes = poll.options[0];
  const no = poll.options[1];
  assert.ok(yes);
  assert.ok(no);
  const first = await h.service.votePoll(ALICE, MESSAGE, yes.id);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.poll.votedOptionId, yes.id);
  assert.equal(first.poll.totalVotes, 1);
  const changed = await h.service.votePoll(ALICE, MESSAGE, no.id);
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.equal(changed.poll.votedOptionId, no.id);
  assert.equal(changed.poll.totalVotes, 1);
});

test("votePoll rejects invalid option", async () => {
  const h = makeHarness();
  await h.service.createPollForMessage(MESSAGE, { question: "Go?", options: ["Yes", "No"] }, ALICE);
  const bogus = "00000000-0000-4000-8000-000000000099" as PollOptionId;
  assert.deepEqual(await h.service.votePoll(ALICE, MESSAGE, bogus), { ok: false, reason: "invalid_option" });
});

test("loadForMessages returns poll keyed by message id", async () => {
  const h = makeHarness();
  await h.service.createPollForMessage(MESSAGE, { question: "Q", options: ["A", "B"] }, ALICE);
  const map = await h.service.loadForMessages([MESSAGE], BOB);
  assert.equal(map.get(MESSAGE)?.question, "Q");
});
