import type { InfiniteData } from "@tanstack/vue-query";
import type { ListMessagesResponse, MessageDto } from "@denser/contracts";

export const MESSAGE_PAGE_SIZE = 20;
export const MESSAGE_MAX_PAGES = 5;

export type MessagesPageParam = null | { cursor: string; direction: "next" | "prev" };

export function encodeMessageCursor(message: MessageDto): string {
  return JSON.stringify([message.createdAt, message.id]);
}

/** True when two rows represent the same logical message (id, clientId, or optimistic id). */
export function isSameMessageIdentity(left: MessageDto, right: MessageDto): boolean {
  if (left.id === right.id) return true;

  const leftClientId = left.clientId ?? null;
  const rightClientId = right.clientId ?? null;
  if (leftClientId && rightClientId && leftClientId === rightClientId) return true;
  if (rightClientId && left.id === rightClientId) return true;
  if (leftClientId && right.id === leftClientId) return true;

  return false;
}

function withLivePageCursor(page: ListMessagesResponse): ListMessagesResponse {
  const last = page.messages.at(-1);
  if (!last) return page;
  return { ...page, prevCursor: encodeMessageCursor(last) };
}

/** Whether the timeline should attempt a newer-direction page fetch. */
export function canLoadNewerMessages(input: {
  reachedLiveEdge: boolean;
  firstPagePrevCursor: string | null | undefined;
}): boolean {
  return !input.reachedLiveEdge && Boolean(input.firstPagePrevCursor);
}

export function messageIdentityKeys(message: MessageDto): string[] {
  const keys = [message.id];
  if (message.clientId) keys.push(message.clientId);
  return keys;
}

export function messagesAreAlreadyKnown(
  messages: readonly MessageDto[],
  knownKeys: ReadonlySet<string>,
): boolean {
  return messages.every((message) =>
    messageIdentityKeys(message).some((key) => knownKeys.has(key)),
  );
}

/** Flatten infinite-query pages to chronological oldest→newest for the timeline. */
export function flattenMessagePages(
  data: InfiniteData<ListMessagesResponse> | undefined,
): MessageDto[] {
  if (!data) return [];

  // Safety net only — overlapping newer pages should be prevented by live-edge gating.
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();
  const ordered: MessageDto[] = [];
  for (const message of [...data.pages].reverse().flatMap((page) => page.messages)) {
    if (seenIds.has(message.id)) continue;
    if (message.clientId && seenClientIds.has(message.clientId)) continue;
    seenIds.add(message.id);
    if (message.clientId) seenClientIds.add(message.clientId);
    ordered.push(message);
  }
  return ordered;
}

export function applyMessageCreated(
  data: InfiniteData<ListMessagesResponse> | undefined,
  event: MessageDto,
): InfiniteData<ListMessagesResponse> | undefined {
  if (!data || data.pages.length === 0) return data;

  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.filter((message) => !isSameMessageIdentity(message, event)),
  }));

  const latest = pages[0]!;
  pages[0] = withLivePageCursor({
    ...latest,
    messages: [...latest.messages, event].slice(-MESSAGE_PAGE_SIZE),
  });
  return { ...data, pages };
}

export function applyMessageUpdated(
  data: InfiniteData<ListMessagesResponse> | undefined,
  event: MessageDto,
): InfiniteData<ListMessagesResponse> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) => (message.id === event.id ? event : message)),
    })),
  };
}

export function applyMessageDeleted(
  data: InfiniteData<ListMessagesResponse> | undefined,
  event: MessageDto,
): InfiniteData<ListMessagesResponse> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) => (message.id === event.id ? event : message)),
    })),
  };
}
