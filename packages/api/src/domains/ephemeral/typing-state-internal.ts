import type { ArtifactId, UserId } from "@denser/contracts";

export type TypingStateOptions = {
  ttlMs: number;
  onExpired?: (conversationId: ArtifactId, userId: UserId) => void;
};

/**
 * In-memory typing registry per conversation. Adapters may run periodic prune
 * so server state does not grow without bound.
 */
export function createTypingState(options: TypingStateOptions) {
  const byConversation = new Map<string, Map<string, number>>();

  function record(
    conversationId: ArtifactId,
    userId: UserId,
    now = Date.now(),
    ttlMs = options.ttlMs,
  ): number {
    const untilMs = now + ttlMs;
    let users = byConversation.get(conversationId);
    if (!users) {
      users = new Map();
      byConversation.set(conversationId, users);
    }
    users.set(userId, untilMs);
    return untilMs;
  }

  function prune(now = Date.now()): void {
    for (const [conversationId, users] of byConversation) {
      for (const [userId, untilMs] of users) {
        if (untilMs <= now) {
          users.delete(userId);
          options.onExpired?.(conversationId as ArtifactId, userId as UserId);
        }
      }
      if (users.size === 0) {
        byConversation.delete(conversationId);
      }
    }
  }

  function isTyping(conversationId: ArtifactId, userId: UserId, now = Date.now()): boolean {
    const untilMs = byConversation.get(conversationId)?.get(userId);
    return untilMs != null && untilMs > now;
  }

  function listActive(conversationId: ArtifactId, now = Date.now()): Array<{ userId: UserId; until: string }> {
    const users = byConversation.get(conversationId);
    if (!users) return [];
    const rows: Array<{ userId: UserId; until: string }> = [];
    for (const [userId, untilMs] of users) {
      if (untilMs > now) {
        rows.push({ userId: userId as UserId, until: new Date(untilMs).toISOString() });
      }
    }
    return rows;
  }

  return { record, prune, isTyping, listActive };
}
