import assert from "node:assert/strict";
import { test } from "node:test";
import { toDraftDto } from "./mapper.js";
import { DRAFT_TTL_MS, decideUpsert, nextDraftExpiry } from "./policy.js";
import type { MessageDraftRow } from "./repository.js";

function draftRow(overrides: Partial<MessageDraftRow> = {}): MessageDraftRow {
  return {
    id: "00000000-0000-0000-0000-000000000000" as MessageDraftRow["id"],
    rootSpaceId: "11111111-1111-1111-1111-111111111111" as MessageDraftRow["rootSpaceId"],
    conversationId: "22222222-2222-2222-2222-222222222222" as MessageDraftRow["conversationId"],
    authorId: "33333333-3333-3333-3333-333333333333" as MessageDraftRow["authorId"],
    threadId: null,
    body: { type: "doc" },
    quotesId: null,
    version: 2,
    expiresAt: new Date("2026-09-06T00:00:00Z"),
    createdAt: new Date("2026-09-05T00:00:00Z"),
    updatedAt: new Date("2026-09-05T00:00:00Z"),
    ...overrides,
  };
}

test("nextDraftExpiry slides expiresAt by the default TTL", () => {
  const now = new Date("2026-09-05T12:00:00Z");
  const expiry = nextDraftExpiry(now);
  assert.equal(expiry.getTime() - now.getTime(), DRAFT_TTL_MS);
});

test("decideUpsert creates only from version 0 when no row exists", () => {
  assert.deepEqual(decideUpsert(null, 0), { kind: "create" });
});

test("decideUpsert conflicts without a server draft on a create race with stale version", () => {
  assert.deepEqual(decideUpsert(null, 3), { kind: "conflict", draft: null });
});

test("decideUpsert updates when the client version matches", () => {
  assert.deepEqual(decideUpsert(draftRow({ version: 2 }), 2), { kind: "update" });
});

test("decideUpsert returns the server draft on a stale version (409)", () => {
  const row = draftRow({ version: 5 });
  const decision = decideUpsert(row, 3);
  assert.equal(decision.kind, "conflict");
  assert.ok(decision.kind === "conflict" && decision.draft === row);
});

test("toDraftDto serializes dates to ISO and preserves body/quotes/version", () => {
  const dto = toDraftDto(draftRow({ threadId: "abc" as MessageDraftRow["threadId"] }), []);
  assert.equal(dto.threadId, "abc");
  assert.equal(dto.version, 2);
  assert.equal(dto.expiresAt, "2026-09-06T00:00:00.000Z");
  assert.equal(dto.quotesId, null);
  assert.deepEqual(dto.attachments, []);
});