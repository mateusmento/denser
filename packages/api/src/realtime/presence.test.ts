import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId, UserId } from "@denser/contracts";
import {
  SEED_ARTIFACT_CHAN_GENERAL,
  SEED_USER_ALICE,
  SEED_USER_BOB,
  TYPING_TTL_MS,
} from "@denser/contracts";
import { createInMemoryPresenceStore } from "../domains/ephemeral/in-memory-presence-store.js";
import { createTypingState } from "../domains/ephemeral/typing-state-internal.js";

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

test("presence store ref-counts users across sockets", async () => {
  const presence = createInMemoryPresenceStore();
  const conversationId = SEED_ARTIFACT_CHAN_GENERAL as ArtifactId;

  const first = await presence.joinConversation({
    conversationId,
    userId: SEED_USER_ALICE,
    socketId: "socket-a",
  });
  assert.equal(first.becameViewer, true);
  assert.deepEqual(first.viewers, [SEED_USER_ALICE]);

  const secondTab = await presence.joinConversation({
    conversationId,
    userId: SEED_USER_ALICE,
    socketId: "socket-b",
  });
  assert.equal(secondTab.becameViewer, false);
  assert.deepEqual(secondTab.viewers, [SEED_USER_ALICE]);

  const partialLeave = await presence.leaveConversation({
    conversationId,
    userId: SEED_USER_ALICE,
    socketId: "socket-a",
  });
  assert.equal(partialLeave.becameAbsent, false);
  assert.deepEqual(partialLeave.viewers, [SEED_USER_ALICE]);

  const lastLeave = await presence.leaveConversation({
    conversationId,
    userId: SEED_USER_ALICE,
    socketId: "socket-b",
  });
  assert.equal(lastLeave.becameAbsent, true);
  assert.deepEqual(lastLeave.viewers, []);

  await presence.joinConversation({
    conversationId,
    userId: SEED_USER_ALICE,
    socketId: "socket-c",
  });
  await presence.joinConversation({
    conversationId,
    userId: SEED_USER_BOB,
    socketId: "socket-d",
  });
  const viewers = await presence.listConversationViewers(conversationId);
  assert.deepEqual(viewers.sort(), [SEED_USER_ALICE, SEED_USER_BOB].sort());
});
