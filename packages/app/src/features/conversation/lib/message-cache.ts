import type { InfiniteData } from "@tanstack/vue-query";
import type { ListMessagesResponse, MessageDto } from "@denser/contracts";

export const MESSAGE_PAGE_SIZE = 20;
export const MESSAGE_MAX_PAGES = 5;

export type MessagesPageParam = null | { cursor: string; direction: "next" | "prev" };

/** Flatten infinite-query pages to chronological oldest→newest for the timeline. */
export function flattenMessagePages(
  data: InfiniteData<ListMessagesResponse> | undefined,
): MessageDto[] {
  if (!data) return [];
  return [...data.pages].reverse().flatMap((page) => page.messages);
}

export function applyMessageCreated(
  data: InfiniteData<ListMessagesResponse> | undefined,
  event: MessageDto,
): InfiniteData<ListMessagesResponse> | undefined {
  if (!data || data.pages.length === 0) return data;

  const already = data.pages.some((page) =>
    page.messages.some(
      (message) =>
        message.id === event.id || (event.clientId && message.clientId === event.clientId),
    ),
  );

  if (already) {
    if (!event.clientId) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        messages: page.messages.map((message) =>
          message.clientId === event.clientId && message.id !== event.id ? event : message,
        ),
      })),
    };
  }

  const pages = [...data.pages];
  const latest = pages[0]!;
  pages[0] = {
    ...latest,
    messages: [...latest.messages, event].slice(-MESSAGE_PAGE_SIZE),
  };
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
