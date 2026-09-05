import { z } from "zod";
import { ArtifactId, MessageId, PollId, PollOptionId } from "./ids.js";

export const CreatePollInput = z.object({
  question: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(200)).min(2).max(10),
});
export type CreatePollInput = z.infer<typeof CreatePollInput>;

export const PollOptionDto = z.object({
  id: PollOptionId,
  label: z.string(),
  voteCount: z.number().int().nonnegative(),
});
export type PollOptionDto = z.infer<typeof PollOptionDto>;

export const PollDto = z.object({
  id: PollId,
  question: z.string(),
  options: z.array(PollOptionDto),
  votedOptionId: PollOptionId.nullable(),
  totalVotes: z.number().int().nonnegative(),
});
export type PollDto = z.infer<typeof PollDto>;

export const VotePollInput = z.object({
  optionId: PollOptionId,
});
export type VotePollInput = z.infer<typeof VotePollInput>;

export const VotePollResponse = z.object({
  messageId: MessageId,
  conversationId: ArtifactId,
  poll: PollDto,
});
export type VotePollResponse = z.infer<typeof VotePollResponse>;
