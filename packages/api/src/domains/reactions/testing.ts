import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import type { ReactionRepository, ReactionRow } from "./types.js";

export function createInMemoryReactionRepository() {
  const state: ReactionRow[] = [];
  const messages = new Map<MessageId, ArtifactId>();
  const repo: ReactionRepository = {
    async findMessageConversation(messageId) { return messages.get(messageId) ?? null; },
    async listForMessage(messageId) { return state.filter((row) => row.messageId === messageId); },
    async listForMessages(messageIds) { const ids = new Set(messageIds); return state.filter((row) => ids.has(row.messageId)); },
    async removeReaction(input) {
      const index = state.findIndex((row) => row.messageId === input.messageId && row.emoji === input.emoji && row.userId === input.userId);
      if (index < 0) return false;
      state.splice(index, 1);
      return true;
    },
    async addReaction(input) {
      if (state.some((row) => row.messageId === input.messageId && row.emoji === input.emoji && row.userId === input.userId)) return;
      state.push({ messageId: input.messageId, emoji: input.emoji, userId: input.userId, reactedAt: input.reactedAt });
    },
  };
  function seedMessage(messageId: MessageId, conversationId: ArtifactId) { messages.set(messageId, conversationId); }
  return { repo, state, seedMessage };
}
