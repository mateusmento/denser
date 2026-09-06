import type { MessageDto, PollDto } from "@denser/contracts";
import type { ListMessagesResponse } from "@denser/contracts";
import type { InfiniteData } from "@tanstack/vue-query";
import type { MessagesPageParam } from "./message-cache";

type MessagesQueryData = InfiniteData<ListMessagesResponse, MessagesPageParam>;

export function applyPollUpdated(
  data: MessagesQueryData | undefined,
  event: { messageId: MessageDto["id"]; poll: PollDto },
): MessagesQueryData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        message.id === event.messageId ? { ...message, poll: event.poll } : message,
      ),
    })),
  };
}

export function votePollOptimistic(poll: PollDto | undefined, optionId: string): PollDto | undefined {
  if (!poll) return poll;
  const previousOptionId = poll.votedOptionId;
  const options = poll.options.map((option) => {
    let voteCount = option.voteCount;
    if (previousOptionId === option.id) voteCount = Math.max(0, voteCount - 1);
    if (option.id === optionId) voteCount += 1;
    return { ...option, voteCount };
  });
  let totalVotes = poll.totalVotes;
  if (!previousOptionId) totalVotes += 1;
  return {
    ...poll,
    options,
    votedOptionId: optionId as PollDto["votedOptionId"],
    totalVotes,
  };
}
