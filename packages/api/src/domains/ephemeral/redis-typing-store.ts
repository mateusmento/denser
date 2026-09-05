import type { ArtifactId, TypingStore, UserId } from "@denser/contracts";
import type { RedisClientType } from "redis";

function typingKey(conversationId: ArtifactId): string {
  return `typing:${conversationId}`;
}

export function createRedisTypingStore(client: RedisClientType): TypingStore {
  return {
    async pulse(input) {
      const now = Date.now();
      const untilMs = now + input.ttlMs;
      const key = typingKey(input.conversationId);
      await client.zAdd(key, { score: untilMs, value: input.userId });
      await client.zRemRangeByScore(key, 0, now);
      await client.expire(key, Math.ceil(input.ttlMs / 1000) + 60);
      return { until: new Date(untilMs).toISOString() };
    },
    async listActive(conversationId) {
      const now = Date.now();
      const key = typingKey(conversationId);
      await client.zRemRangeByScore(key, 0, now);
      const entries = await client.zRangeWithScores(key, now, "+inf", { BY: "SCORE" });
      return entries.map((entry) => ({
        userId: entry.value as UserId,
        until: new Date(entry.score).toISOString(),
      }));
    },
  };
}
