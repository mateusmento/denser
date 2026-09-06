import assert from "node:assert/strict";
import { test } from "node:test";
import type { MessageDraftDto } from "@denser/contracts";
import { emptyDoc } from "@/modules/rich-text/types";
import { reconcileDraftConflict } from "./draft-conflict.js";

const draft: MessageDraftDto = {
  id: "00000000-0000-4000-8000-000000000001",
  conversationId: "00000000-0000-4000-8000-000000000002",
  threadId: null,
  body: null,
  quotesId: null,
  version: 2,
  attachments: [],
};

test("reconcileDraftConflict keeps local edits when dirty", () => {
  const next = reconcileDraftConflict(draft, { dirty: true });
  assert.equal(next.version, 2);
  assert.equal(next.draftId, draft.id);
  assert.equal(next.replaceBody, null);
});

test("reconcileDraftConflict adopts server body when idle", () => {
  const next = reconcileDraftConflict(draft, { dirty: false });
  assert.equal(next.version, 2);
  assert.deepEqual(next.replaceBody, emptyDoc());
});
