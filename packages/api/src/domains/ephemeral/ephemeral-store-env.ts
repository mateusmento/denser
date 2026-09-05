import type { PresenceStore, TypingStore } from "@denser/contracts";
import { TYPING_TTL_MS } from "@denser/contracts";
import { createClient, type RedisClientType } from "redis";
import { createInMemoryPresenceStore } from "./in-memory-presence-store.js";
import { createInMemoryTypingStore } from "./in-memory-typing-store.js";
import { createRedisPresenceStore } from "./redis-presence-store.js";
import { createRedisTypingStore } from "./redis-typing-store.js";

export type EphemeralStoreAdapterName = "memory" | "redis";

export type RealtimeAdapterName = "local" | "redis";

export function resolveEphemeralStoreAdapter(env: NodeJS.ProcessEnv = process.env): EphemeralStoreAdapterName {
  const raw = env.EPHEMERAL_STORE_ADAPTER?.trim().toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}

export function resolveRealtimeAdapter(env: NodeJS.ProcessEnv = process.env): RealtimeAdapterName {
  const raw = env.REALTIME_ADAPTER?.trim().toLowerCase();
  return raw === "redis" ? "redis" : "local";
}

export function readRedisUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = env.REDIS_URL?.trim();
  return value || undefined;
}

let sharedRedisClient: RedisClientType | null = null;

export async function getSharedRedisClient(env: NodeJS.ProcessEnv = process.env): Promise<RedisClientType> {
  const url = readRedisUrl(env);
  if (!url) {
    throw new Error("REDIS_URL is required when EPHEMERAL_STORE_ADAPTER=redis or REALTIME_ADAPTER=redis");
  }
  if (!sharedRedisClient) {
    sharedRedisClient = createClient({ url });
    sharedRedisClient.on("error", (error) => {
      console.error("Redis client error", error);
    });
    await sharedRedisClient.connect();
  }
  return sharedRedisClient;
}

export function createEphemeralStoresFromEnv(env: NodeJS.ProcessEnv = process.env): {
  typingStore: TypingStore;
  presenceStore: PresenceStore;
} {
  if (resolveEphemeralStoreAdapter(env) === "redis") {
    throw new Error("createEphemeralStoresFromEnv is sync — use createEphemeralStoresFromEnvAsync for redis");
  }
  return {
    typingStore: createInMemoryTypingStore({ defaultTtlMs: TYPING_TTL_MS }),
    presenceStore: createInMemoryPresenceStore(),
  };
}

export async function createEphemeralStoresFromEnvAsync(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ typingStore: TypingStore; presenceStore: PresenceStore }> {
  if (resolveEphemeralStoreAdapter(env) !== "redis") {
    return createEphemeralStoresFromEnv(env);
  }
  const client = await getSharedRedisClient(env);
  return {
    typingStore: createRedisTypingStore(client),
    presenceStore: createRedisPresenceStore(client),
  };
}
