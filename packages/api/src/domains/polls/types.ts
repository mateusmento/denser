import type { ArtifactId, CreatePollInput, MessageId, PollDto, PollId, PollOptionId, UserId } from "@denser/contracts";

export type PollOptionRow = {
  id: PollOptionId;
  pollId: PollId;
  label: string;
  position: number;
};

export type PollRow = {
  id: PollId;
  messageId: MessageId;
  question: string;
};

export type PollVoteRow = {
  pollId: PollId;
  userId: UserId;
  optionId: PollOptionId;
  votedAt: Date;
};

export type PollRepository = {
  findMessageConversation(messageId: MessageId): Promise<ArtifactId | null>;
  createPollForMessage(messageId: MessageId, input: CreatePollInput): Promise<PollRow>;
  findPollByMessageId(messageId: MessageId): Promise<PollRow | null>;
  listPollsForMessages(messageIds: readonly MessageId[]): Promise<PollRow[]>;
  listOptionsForPolls(pollIds: readonly PollId[]): Promise<PollOptionRow[]>;
  listVotesForPolls(pollIds: readonly PollId[]): Promise<PollVoteRow[]>;
  findPollById(pollId: PollId): Promise<PollRow | null>;
  upsertVote(input: { pollId: PollId; userId: UserId; optionId: PollOptionId; votedAt: Date }): Promise<void>;
  optionBelongsToPoll(optionId: PollOptionId, pollId: PollId): Promise<boolean>;
};
