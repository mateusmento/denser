import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, UserId } from "@denser/contracts";
import {
  SEED_ARTIFACT_CHAN_GENERAL,
  SEED_USER_ALICE,
  SEED_USER_BOB,
  TYPING_TTL_MS,
} from "@denser/contracts";
import { createPresenceRegistry } from "./presence-registry.js";
import { createTypingState } from "./typing-state.js";

test("typing state records until and prunes expired users", () => {
  const expired: UserId[] = [];
  const typing = createTypingState({
    ttlMs: TYPING_TTL_MS,
    onExpired: (_conversationId, userId) => expired.push(userId),
  });

  const start = 1_000_000;
  const until = typing.record(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE, start);
  assert.equal(until, start + TYPING_TTL_MS);
  assert.equal(typing.isTyping(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE, start), true);

  typing.prune(start + TYPING_TTL_MS);
  assert.deepEqual(expired, [SEED_USER_ALICE]);
  assert.equal(typing.isTyping(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE, start + TYPING_TTL_MS), false);
});

test("presence registry ref-counts users across sockets", () => {
  const viewers = createPresenceRegistry<ArtifactId>();

  assert.equal(viewers.add(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE), true);
  assert.equal(viewers.add(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE), false);
  assert.deepEqual(viewers.list(SEED_ARTIFACT_CHAN_GENERAL), [SEED_USER_ALICE]);

  assert.equal(viewers.remove(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE), false);
  assert.equal(viewers.has(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE), true);

  assert.equal(viewers.remove(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE), true);
  assert.deepEqual(viewers.list(SEED_ARTIFACT_CHAN_GENERAL), []);

  viewers.add(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_ALICE);
  viewers.add(SEED_ARTIFACT_CHAN_GENERAL, SEED_USER_BOB);
  assert.deepEqual(viewers.list(SEED_ARTIFACT_CHAN_GENERAL).sort(), [SEED_USER_ALICE, SEED_USER_BOB].sort());
});
