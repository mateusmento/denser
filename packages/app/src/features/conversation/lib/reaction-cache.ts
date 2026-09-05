import type { InfiniteData } from "@tanstack/vue-query";
import type { ListMessagesResponse, MessageDto, ReactionAggregateDto } from "@denser/contracts";

export function applyReactionUpdated(
  data: InfiniteData<ListMessagesResponse> | undefined,
  event: { messageId: MessageDto["id"]; reactions: ReactionAggregateDto[] },
): InfiniteData<ListMessagesResponse> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        message.id === event.messageId ? { ...message, reactions: event.reactions } : message,
      ),
    })),
  };
}

export function toggleReactionOptimistic(reactions: ReactionAggregateDto[] | undefined, emoji: string): ReactionAggregateDto[] {
  const current = reactions ?? [];
  const existing = current.find((reaction) => reaction.emoji === emoji);
  if (existing?.reactedByMe) {
    const nextCount = existing.count - 1;
    if (nextCount <= 0) return current.filter((reaction) => reaction.emoji !== emoji);
    return current.map((reaction) => reaction.emoji === emoji ? { ...reaction, count: nextCount, reactedByMe: false } : reaction);
  }
  if (existing) {
    return current.map((reaction) => reaction.emoji === emoji ? { ...reaction, count: reaction.count + 1, reactedByMe: true } : reaction);
  }
  return [...current, { emoji, count: 1, reactedByMe: true }];
}
