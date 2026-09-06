import type { ArtifactId, CreatePollInput, MessageId, PollDto, PollOptionId, UserId } from "@denser/contracts";
import { buildPollDto, buildPollMap } from "./aggregate.js";
import type { PollRepository } from "./types.js";

export type PollAccess = (userId: UserId, conversationId: ArtifactId) => Promise<boolean>;

export type PollServiceDeps = {
  repo: PollRepository;
  access: PollAccess;
};

export type VotePollResult =
  | { ok: true; messageId: MessageId; conversationId: ArtifactId; poll: PollDto }
  | { ok: false; reason: "not_found" | "invalid_option" };

export type PollService = {
  createPollForMessage(messageId: MessageId, input: CreatePollInput, viewerId: UserId): Promise<PollDto>;
  loadForMessages(messageIds: readonly MessageId[], viewerId: UserId): Promise<Map<MessageId, PollDto>>;
  votePoll(userId: UserId, messageId: MessageId, optionId: PollOptionId): Promise<VotePollResult>;
};

export function createPollService(deps: PollServiceDeps): PollService {
  const { repo } = deps;

  async function loadPollDto(messageId: MessageId, viewerId: UserId): Promise<PollDto | undefined> {
    const poll = await repo.findPollByMessageId(messageId);
    if (!poll) return undefined;
    const [options, votes] = await Promise.all([
      repo.listOptionsForPolls([poll.id]),
      repo.listVotesForPolls([poll.id]),
    ]);
    return buildPollDto(poll, options, votes, viewerId);
  }

  return {
    async createPollForMessage(messageId, input, viewerId) {
      const poll = await repo.createPollForMessage(messageId, input);
      const options = await repo.listOptionsForPolls([poll.id]);
      return buildPollDto(poll, options, [], viewerId);
    },
    async loadForMessages(messageIds, viewerId) {
      const polls = await repo.listPollsForMessages(messageIds);
      if (polls.length === 0) return new Map();
      const pollIds = polls.map((p) => p.id);
      const [options, votes] = await Promise.all([
        repo.listOptionsForPolls(pollIds),
        repo.listVotesForPolls(pollIds),
      ]);
      const dtoByPollId = buildPollMap(polls, options, votes, viewerId);
      const map = new Map<MessageId, PollDto>();
      for (const poll of polls) {
        const dto = dtoByPollId.get(poll.id);
        if (dto) map.set(poll.messageId, dto);
      }
      return map;
    },
    async votePoll(userId, messageId, optionId) {
      const conversationId = await repo.findMessageConversation(messageId);
      if (!conversationId || !(await deps.access(userId, conversationId))) {
        return { ok: false, reason: "not_found" };
      }
      const poll = await repo.findPollByMessageId(messageId);
      if (!poll) return { ok: false, reason: "not_found" };
      if (!(await repo.optionBelongsToPoll(optionId, poll.id))) {
        return { ok: false, reason: "invalid_option" };
      }
      await repo.upsertVote({ pollId: poll.id, userId, optionId, votedAt: new Date() });
      const pollDto = await loadPollDto(messageId, userId);
      if (!pollDto) return { ok: false, reason: "not_found" };
      return { ok: true, messageId, conversationId, poll: pollDto };
    },
  };
}
