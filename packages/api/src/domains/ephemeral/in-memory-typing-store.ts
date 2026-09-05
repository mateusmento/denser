import type { ArtifactId, TypingStore, UserId } from "@denser/contracts";
import { createTypingState } from "./typing-state-internal.js";

export type InMemoryTypingStoreOptions = {
  defaultTtlMs: number;
  pruneIntervalMs?: number;
};

export function createInMemoryTypingStore(options: InMemoryTypingStoreOptions): TypingStore {
  const typingState = createTypingState({ ttlMs: options.defaultTtlMs });
  const pruneIntervalMs = options.pruneIntervalMs ?? 500;
  const pruneTimer = setInterval(() => typingState.prune(), pruneIntervalMs);
  if (typeof pruneTimer === "object" && "unref" in pruneTimer) {
    pruneTimer.unref();
  }

  return {
    async pulse(input) {
      const untilMs = typingState.record(input.conversationId, input.userId, Date.now(), input.ttlMs);
      return { until: new Date(untilMs).toISOString() };
    },
    async listActive(conversationId) {
      typingState.prune();
      return typingState.listActive(conversationId);
    },
  };
}
