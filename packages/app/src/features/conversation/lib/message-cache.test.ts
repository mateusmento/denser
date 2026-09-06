import assert from "node:assert/strict";
import { test } from "node:test";
import type { InfiniteData } from "@tanstack/vue-query";
import type { ListMessagesResponse, MessageDto } from "@denser/contracts";
import {
  applyMessageCreated,
  canLoadNewerMessages,
  encodeMessageCursor,
  flattenMessagePages,
  isSameMessageIdentity,
  messagesAreAlreadyKnown,
} from "./message-cache.js";

function message(
  id: string,
  createdAt: string,
  clientId: string | null = null,
): MessageDto {
  return {
    id: id as MessageDto["id"],
    conversationId: "00000000-0000-4000-8000-000000000001" as MessageDto["conversationId"],
    threadId: null,
    quotesId: null,
    authorId: "00000000-0000-4000-8000-000000000002" as MessageDto["authorId"],
    body: { type: "doc", content: [] },
    clientId: clientId as MessageDto["clientId"],
    createdAt,
    editedAt: null,
    deletedAt: null,
    attachmentIds: [],
  };
}

function page(messages: MessageDto[], prevCursor: string | null = null): ListMessagesResponse {
  const first = messages[0];
  const last = messages.at(-1);
  return {
    messages,
    nextCursor: first ? encodeMessageCursor(first) : null,
    prevCursor: prevCursor ?? (last ? encodeMessageCursor(last) : null),
  };
}

function infinite(pages: ListMessagesResponse[]): InfiniteData<ListMessagesResponse> {
  return {
    pages,
    pageParams: pages.map(() => null),
  };
}

test("flattenMessagePages dedupes overlapping newer-page fetches", () => {
  const m24 = message("00000000-0000-4000-8000-000000000024", "2026-01-01T00:24:00.000Z");
  const m25 = message("00000000-0000-4000-8000-000000000025", "2026-01-01T00:25:00.000Z");

  const data = infinite([
    page([m25], encodeMessageCursor(m24)),
    page([message("00000000-0000-4000-8000-000000000023", "2026-01-01T00:23:00.000Z"), m24, m25]),
  ]);

  assert.deepEqual(
    flattenMessagePages(data).map((row) => row.id),
    [
      "00000000-0000-4000-8000-000000000023",
      "00000000-0000-4000-8000-000000000024",
      "00000000-0000-4000-8000-000000000025",
    ],
  );
});

test("applyMessageCreated advances live prevCursor when appending", () => {
  const m24 = message("00000000-0000-4000-8000-000000000024", "2026-01-01T00:24:00.000Z");
  const m25 = message("00000000-0000-4000-8000-000000000025", "2026-01-01T00:25:00.000Z");
  const data = infinite([page([m24], encodeMessageCursor(m24))]);

  const next = applyMessageCreated(data, m25);
  assert.ok(next);
  assert.equal(next!.pages[0]!.prevCursor, encodeMessageCursor(m25));
  assert.deepEqual(flattenMessagePages(next).map((row) => row.id), [m24.id, m25.id]);
});

test("canLoadNewerMessages blocks bottom fetches at the live edge", () => {
  assert.equal(
    canLoadNewerMessages({
      reachedLiveEdge: true,
      firstPagePrevCursor: encodeMessageCursor(
        message("00000000-0000-4000-8000-000000000025", "2026-01-01T00:25:00.000Z"),
      ),
    }),
    false,
  );
  assert.equal(
    canLoadNewerMessages({
      reachedLiveEdge: false,
      firstPagePrevCursor: null,
    }),
    false,
  );
  assert.equal(
    canLoadNewerMessages({
      reachedLiveEdge: false,
      firstPagePrevCursor: "cursor",
    }),
    true,
  );
});

test("applyMessageCreated collapses optimistic send with fetched server row", () => {
  const clientId = "00000000-0000-4000-8000-00000000aaaa";
  const serverId = "00000000-0000-4000-8000-000000000025";
  const m24 = message("00000000-0000-4000-8000-000000000024", "2026-01-01T00:24:00.000Z");
  const optimistic = message(clientId, "2026-01-01T00:25:00.000Z", clientId);
  const fetched = message(serverId, "2026-01-01T00:25:00.000Z", clientId);

  const withOptimistic = applyMessageCreated(infinite([page([m24])]), optimistic);
  assert.ok(withOptimistic);
  const withFetchedPage = infinite([
    page([fetched], encodeMessageCursor(m24)),
    page([m24, optimistic]),
  ]);

  assert.equal(isSameMessageIdentity(optimistic, fetched), true);
  assert.deepEqual(
    flattenMessagePages(withFetchedPage).map((row) => row.id),
    [m24.id, optimistic.id],
  );

  const consolidated = applyMessageCreated(withFetchedPage, fetched);
  assert.deepEqual(flattenMessagePages(consolidated).map((row) => row.id), [m24.id, serverId]);
});

test("messagesAreAlreadyKnown matches optimistic clientId against server id", () => {
  const clientId = "00000000-0000-4000-8000-00000000aaaa";
  const optimistic = message(clientId, "2026-01-01T00:25:00.000Z", clientId);
  const fetched = message(
    "00000000-0000-4000-8000-000000000025",
    "2026-01-01T00:25:00.000Z",
    clientId,
  );
  const knownKeys = new Set([optimistic.id, clientId]);

  assert.equal(messagesAreAlreadyKnown([fetched], knownKeys), true);
});
