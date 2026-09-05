import { randomUUID } from "node:crypto";
import type { ArtifactId, CreatePollInput, MessageId, PollId, PollOptionId, UserId } from "@denser/contracts";
import type { PollOptionRow, PollRepository, PollRow, PollVoteRow } from "./types.js";

export function createInMemoryPollRepository() {
  const messages = new Map<MessageId, ArtifactId>();
  const polls = new Map<PollId, PollRow>();
  const pollByMessage = new Map<MessageId, PollId>();
  const options = new Map<PollOptionId, PollOptionRow>();
  const votes: PollVoteRow[] = [];

  function seedMessage(messageId: MessageId, conversationId: ArtifactId) {
    messages.set(messageId, conversationId);
  }

  const repo: PollRepository = {
    async findMessageConversation(messageId) {
      return messages.get(messageId) ?? null;
    },
    async createPollForMessage(messageId, input: CreatePollInput) {
      const id = randomUUID() as PollId;
      const row: PollRow = { id, messageId, question: input.question };
      polls.set(id, row);
      pollByMessage.set(messageId, id);
      input.options.forEach((label, position) => {
        const optionId = randomUUID() as PollOptionId;
        options.set(optionId, { id: optionId, pollId: id, label, position });
      });
      return row;
    },
    async findPollByMessageId(messageId) {
      const pollId = pollByMessage.get(messageId);
      return pollId ? polls.get(pollId) ?? null : null;
    },
    async listPollsForMessages(messageIds) {
      return messageIds
        .map((messageId) => pollByMessage.get(messageId))
        .filter((pollId): pollId is PollId => pollId != null)
        .map((pollId) => polls.get(pollId)!)
        .filter(Boolean);
    },
    async listOptionsForPolls(pollIds) {
      return [...options.values()].filter((option) => pollIds.includes(option.pollId));
    },
    async listVotesForPolls(pollIds) {
      return votes.filter((vote) => pollIds.includes(vote.pollId));
    },
    async findPollById(pollId) {
      return polls.get(pollId) ?? null;
    },
    async upsertVote(input) {
      const index = votes.findIndex((vote) => vote.pollId === input.pollId && vote.userId === input.userId);
      if (index >= 0) votes[index] = { ...input };
      else votes.push({ ...input });
    },
    async optionBelongsToPoll(optionId, pollId) {
      const option = options.get(optionId);
      return option?.pollId === pollId;
    },
  };

  return { repo, seedMessage, votes, options };
}
