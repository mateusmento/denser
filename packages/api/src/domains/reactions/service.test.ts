import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import { aggregateReactions } from "./aggregate.js";
import { createReactionService } from "./service.js";
import { createInMemoryReactionRepository } from "./testing.js";

const CONVERSATION = "00000000-0000-4000-8000-000000000001" as ArtifactId;
const MESSAGE = "00000000-0000-4000-8000-000000000010" as MessageId;
const OTHER = "00000000-0000-4000-8000-000000000011" as MessageId;
const ALICE = "00000000-0000-4000-8000-00000000000a" as UserId;
const BOB = "00000000-0000-4000-8000-00000000000b" as UserId;

function makeHarness() {
  const { repo, state, seedMessage } = createInMemoryReactionRepository();
  seedMessage(MESSAGE, CONVERSATION);
  seedMessage(OTHER, CONVERSATION);
  const emitted = [] as { messageId: MessageId; conversationId: ArtifactId; reactions: unknown[] }[];
  const service = createReactionService({ repo, access: async () => true, emit: (payload) => emitted.push(payload) });
  return { service, state, emitted };
}

test("aggregateReactions groups by emoji and marks viewer", () => {
  const aggregates = aggregateReactions([
    { messageId: MESSAGE, emoji: "👍", userId: ALICE, reactedAt: new Date("2026-09-05T12:00:00.000Z") },
    { messageId: MESSAGE, emoji: "👍", userId: BOB, reactedAt: new Date("2026-09-05T12:01:00.000Z") },
    { messageId: MESSAGE, emoji: "🎉", userId: BOB, reactedAt: new Date("2026-09-05T12:02:00.000Z") },
  ], ALICE);
  assert.deepEqual(aggregates, [
    { emoji: "👍", count: 2, reactedByMe: true },
    { emoji: "🎉", count: 1, reactedByMe: false },
  ]);
});

test("toggleReaction adds then removes for same user", async () => {
  const h = makeHarness();
  const added = await h.service.toggleReaction(ALICE, MESSAGE, "👍");
  assert.equal(added.ok, true);
  if (!added.ok) return;
  assert.equal(added.action, "added");
  const removed = await h.service.toggleReaction(ALICE, MESSAGE, "👍");
  assert.equal(removed.ok, true);
  if (!removed.ok) return;
  assert.equal(removed.action, "removed");
  assert.deepEqual(removed.reactions, []);
});

test("toggleReaction allows multiple users on same emoji", async () => {
  const h = makeHarness();
  await h.service.toggleReaction(ALICE, MESSAGE, "✅");
  const bob = await h.service.toggleReaction(BOB, MESSAGE, "✅");
  assert.equal(bob.ok, true);
  if (!bob.ok) return;
  assert.deepEqual(bob.reactions, [{ emoji: "✅", count: 2, reactedByMe: true }]);
});

test("toggleReaction returns not_found without access", async () => {
  const { repo, seedMessage } = createInMemoryReactionRepository();
  seedMessage(MESSAGE, CONVERSATION);
  const service = createReactionService({ repo, access: async () => false, emit: () => undefined });
  assert.deepEqual(await service.toggleReaction(ALICE, MESSAGE, "👍"), { ok: false, reason: "not_found" });
});

test("loadAggregatesForMessages returns empty arrays for messages without reactions", async () => {
  const h = makeHarness();
  await h.service.toggleReaction(ALICE, MESSAGE, "👍");
  const map = await h.service.loadAggregatesForMessages([MESSAGE, OTHER], ALICE);
  assert.deepEqual(map.get(MESSAGE), [{ emoji: "👍", count: 1, reactedByMe: true }]);
  assert.deepEqual(map.get(OTHER), []);
});
