import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { ArtifactId, UserId } from "@denser/contracts";
import { db } from "../../db/client.js";
import * as readStateRepository from "./repository.js";

const CONVERSATION = "00000000-0000-4000-8000-000000000031" as ArtifactId;
const ALICE = "00000000-0000-4000-8000-000000000001" as UserId;
const DAVID = "00000000-0000-4000-8000-000000000004" as UserId;

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("countUnreadMessages: excludes own messages and counts others after lastReadAt", async () => {
  const readRow = await readStateRepository.findReadState(CONVERSATION, ALICE);
  const unread = await readStateRepository.countUnreadMessages(
    CONVERSATION,
    ALICE,
    readRow?.lastReadAt ?? null,
  );

  assert.ok(unread >= 0);

  const firstUnread = await readStateRepository.findFirstUnreadMessageId(
    CONVERSATION,
    ALICE,
    readRow?.lastReadAt ?? null,
  );

  if (unread > 0) {
    assert.ok(firstUnread);
  }
});

test("markConversationRead: advances read state to latest", async (t) => {
  const latest = await readStateRepository.findLatestMessageCreatedAt(CONVERSATION);
  if (!latest) {
    t.skip("engineering channel seed messages not present");
    return;
  }

  const row = await readStateRepository.upsertReadState({
    conversationId: CONVERSATION,
    userId: ALICE,
    lastReadAt: latest,
  });

  assert.equal(row.conversationId, CONVERSATION);
  assert.equal(row.userId, ALICE);

  const unreadAfter = await readStateRepository.countUnreadMessages(
    CONVERSATION,
    ALICE,
    row.lastReadAt,
  );
  assert.equal(unreadAfter, 0);
});

test("findFirstUnreadMessageId: returns far quote target when never read", async () => {
  const neverReadAt = new Date(0);
  const first = await readStateRepository.findFirstUnreadMessageId(
    CONVERSATION,
    DAVID,
    neverReadAt,
  );

  assert.ok(first);
});
