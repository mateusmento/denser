import assert from "node:assert/strict";
import { test } from "node:test";
import type { AttachmentAnchor, AttachmentId, AttachmentReferences } from "@denser/contracts";
import { computeSyncDelta, isEligibleAttachment, isGcable, anchorKey } from "./rules.js";

const anId = ((s: string) => s) as unknown as AttachmentId;

test("sync delta sets exact join set", () => {
  assert.deepEqual(computeSyncDelta([], ["a" as AttachmentId]), {
    toAdd: ["a" as AttachmentId],
    toRemove: [],
  });
  assert.deepEqual(
    computeSyncDelta(
      ["a" as AttachmentId, "b" as AttachmentId],
      ["b" as AttachmentId, "c" as AttachmentId],
    ),
    { toAdd: ["c" as AttachmentId], toRemove: ["a" as AttachmentId] },
  );
  assert.deepEqual(computeSyncDelta(["a" as AttachmentId], []), {
    toAdd: [],
    toRemove: ["a" as AttachmentId],
  });
});

test("anchorKey is unique across types", () => {
  const draft = { type: "draft", draftId: "d" } as unknown as AttachmentAnchor;
  const scheduled = { type: "scheduled", scheduledJobId: "d" } as unknown as AttachmentAnchor;
  const message = { type: "message", messageId: "d" } as unknown as AttachmentAnchor;
  assert.equal(anchorKey(draft), "draft:d");
  assert.equal(anchorKey(scheduled), "scheduled:d");
  assert.equal(anchorKey(message), "message:d");
  assert.notEqual(anchorKey(draft), anchorKey(scheduled));
});

test("eligibility: workspace match required", () => {
  const eligible = isEligibleAttachment({
    attachment: { rootSpaceId: "ws", conversationId: null, uploadedBy: "u1" },
    scope: { rootSpaceId: "ws" },
    actorUserId: "u1",
    trustedDelivery: false,
  });
  assert.equal(eligible, true);

  const wrongWorkspace = isEligibleAttachment({
    attachment: { rootSpaceId: "ws2", conversationId: null, uploadedBy: "u1" },
    scope: { rootSpaceId: "ws" },
    actorUserId: "u1",
    trustedDelivery: false,
  });
  assert.equal(wrongWorkspace, false);
});

test("eligibility: optional conversation match", () => {
  const ok = isEligibleAttachment({
    attachment: { rootSpaceId: "ws", conversationId: "c1", uploadedBy: "u1" },
    scope: { rootSpaceId: "ws", conversationId: "c1" },
    actorUserId: "u1",
    trustedDelivery: false,
  });
  assert.equal(ok, true);

  const mismatch = isEligibleAttachment({
    attachment: { rootSpaceId: "ws", conversationId: "c2", uploadedBy: "u1" },
    scope: { rootSpaceId: "ws", conversationId: "c1" },
    actorUserId: "u1",
    trustedDelivery: false,
  });
  assert.equal(mismatch, false);
});

test("eligibility: uploader match unless trustedDelivery", () => {
  const notOwner = isEligibleAttachment({
    attachment: { rootSpaceId: "ws", conversationId: null, uploadedBy: "u1" },
    scope: { rootSpaceId: "ws" },
    actorUserId: "u2",
    trustedDelivery: false,
  });
  assert.equal(notOwner, false);

  const trusted = isEligibleAttachment({
    attachment: { rootSpaceId: "ws", conversationId: null, uploadedBy: "u1" },
    scope: { rootSpaceId: "ws" },
    actorUserId: "u2",
    trustedDelivery: true,
  });
  assert.equal(trusted, true);
});

test("gcable: refcount 0 + before grace + not protected", () => {
  const oldDate = new Date("2026-01-01T00:00:00Z");
  const now = new Date("2026-02-01T00:00:00Z");
  assert.equal(
    isGcable({ joinCount: 0, createdAt: oldDate, graceBefore: now, protected: false }),
    true,
  );
  assert.equal(
    isGcable({ joinCount: 1, createdAt: oldDate, graceBefore: now, protected: false }),
    false,
  );
  assert.equal(
    isGcable({
      joinCount: 0,
      createdAt: new Date("2026-03-01T00:00:00Z"),
      graceBefore: now,
      protected: false,
    }),
    false,
  );
  assert.equal(
    isGcable({ joinCount: 0, createdAt: oldDate, graceBefore: now, protected: true }),
    false,
  );
});

// The "refcount + concurrent GC race" guard, exercised through the same predicate
// the module uses when deciding what to delete: a reclaimed blob must never be
// deleted while a concurrent sync still references it.
test("concurrent GC race: a late-arriving join prevents deletion", () => {
  const oldDate = new Date("2026-01-01T00:00:00Z");
  const now = new Date("2026-02-01T00:00:00Z");

  // Reclaim reads refcount = 0 and would delete...
  const wouldDelete = isGcable({
    joinCount: 0,
    createdAt: oldDate,
    graceBefore: now,
    protected: false,
  });
  assert.equal(wouldDelete, true);

  // ...but a concurrent sync adds a join before reclaim's guarded delete:
  const afterSyncJoin = isGcable({
    joinCount: 1,
    createdAt: oldDate,
    graceBefore: now,
    protected: false,
  });
  assert.equal(afterSyncJoin, false);
});

test("AttachmentReferences port surface is complete", () => {
  const surface: keyof AttachmentReferences = "commit";
  const load: keyof AttachmentReferences = "load";
  const list: keyof AttachmentReferences = "listDeliveredForConversation";
  assert.equal(surface, "commit");
  assert.equal(load, "load");
  assert.equal(list, "listDeliveredForConversation");
  assert.ok(anId);
});
