import { z } from "zod";
import { ArtifactId, MessageId } from "./ids.js";

export const ReactionEmoji = z.string().trim().min(1).max(32);
export type ReactionEmoji = z.infer<typeof ReactionEmoji>;

export const ReactionAggregateDto = z.object({
  emoji: ReactionEmoji,
  count: z.number().int().nonnegative(),
  reactedByMe: z.boolean(),
});
export type ReactionAggregateDto = z.infer<typeof ReactionAggregateDto>;

export const ToggleReactionInput = z.object({ emoji: ReactionEmoji });
export type ToggleReactionInput = z.infer<typeof ToggleReactionInput>;

export const ReactionToggleAction = z.enum(["added", "removed"]);
export type ReactionToggleAction = z.infer<typeof ReactionToggleAction>;

export const ToggleReactionResponse = z.object({
  messageId: MessageId,
  conversationId: ArtifactId,
  action: ReactionToggleAction,
  reactions: z.array(ReactionAggregateDto),
});
export type ToggleReactionResponse = z.infer<typeof ToggleReactionResponse>;

export const REACTION_UPDATED_EVENT = "reaction.updated" as const;

export const ReactionUpdatedEvent = z.object({
  messageId: MessageId,
  conversationId: ArtifactId,
  reactions: z.array(ReactionAggregateDto),
});
export type ReactionUpdatedEvent = z.infer<typeof ReactionUpdatedEvent>;
