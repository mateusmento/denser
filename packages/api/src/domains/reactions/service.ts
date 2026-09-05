import type { ArtifactId, MessageId, ReactionAggregateDto, ReactionToggleAction, UserId } from "@denser/contracts";
import { aggregateReactions } from "./aggregate.js";
import type { ReactionRepository } from "./types.js";

export type ReactionAccess = (userId: UserId, conversationId: ArtifactId) => Promise<boolean>;
export type ReactionEmitter = (payload: { messageId: MessageId; conversationId: ArtifactId; reactions: ReactionAggregateDto[] }) => void;

export type ReactionServiceDeps = { repo: ReactionRepository; access: ReactionAccess; emit: ReactionEmitter };

export type ToggleReactionResult =
  | { ok: true; messageId: MessageId; conversationId: ArtifactId; action: ReactionToggleAction; reactions: ReactionAggregateDto[] }
  | { ok: false; reason: "not_found" };

export type ReactionService = {
  toggleReaction(userId: UserId, messageId: MessageId, emoji: string): Promise<ToggleReactionResult>;
  loadAggregatesForMessages(messageIds: readonly MessageId[], viewerId: UserId): Promise<Map<MessageId, ReactionAggregateDto[]>>;
};

export function createReactionService(deps: ReactionServiceDeps): ReactionService {
  const { repo } = deps;

  async function loadAggregatesForMessages(messageIds: readonly MessageId[], viewerId: UserId) {
    const rows = await repo.listForMessages(messageIds);
    const byMessage = new Map<MessageId, typeof rows>();
    for (const row of rows) {
      const bucket = byMessage.get(row.messageId);
      if (bucket) bucket.push(row);
      else byMessage.set(row.messageId, [row]);
    }
    const map = new Map<MessageId, ReactionAggregateDto[]>();
    for (const messageId of messageIds) {
      map.set(messageId, aggregateReactions(byMessage.get(messageId) ?? [], viewerId));
    }
    return map;
  }

  async function toggleReaction(userId: UserId, messageId: MessageId, emoji: string): Promise<ToggleReactionResult> {
    const conversationId = await repo.findMessageConversation(messageId);
    if (!conversationId || !(await deps.access(userId, conversationId))) {
      return { ok: false, reason: "not_found" };
    }
    const removed = await repo.removeReaction({ messageId, emoji, userId });
    const action: ReactionToggleAction = removed ? "removed" : "added";
    if (!removed) {
      await repo.addReaction({ messageId, emoji, userId, reactedAt: new Date() });
    }
    const reactions = aggregateReactions(await repo.listForMessage(messageId), userId);
    deps.emit({ messageId, conversationId, reactions });
    return { ok: true, messageId, conversationId, action, reactions };
  }

  return { toggleReaction, loadAggregatesForMessages };
}
