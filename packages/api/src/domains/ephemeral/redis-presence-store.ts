import type { ArtifactId, PresenceStore, SpaceId, UserId } from "@denser/contracts";
import type { RedisClientType } from "redis";

function member(userId: UserId, socketId: string): string {
  return `${userId}\u0000${socketId}`;
}

function userIdFromMember(raw: string): UserId {
  const idx = raw.indexOf("\u0000");
  return (idx >= 0 ? raw.slice(0, idx) : raw) as UserId;
}

function conversationKey(conversationId: ArtifactId): string {
  return `presence:conv:${conversationId}`;
}

function workspaceKey(rootSpaceId: SpaceId): string {
  return `presence:ws:${rootSpaceId}`;
}

async function listUserIds(client: RedisClientType, key: string): Promise<UserId[]> {
  const members = await client.sMembers(key);
  return [...new Set(members.map(userIdFromMember))];
}

async function userHasOtherSockets(
  client: RedisClientType,
  key: string,
  userId: UserId,
  exceptSocketId?: string,
): Promise<boolean> {
  const members = await client.sMembers(key);
  const prefix = `${userId}\u0000`;
  for (const raw of members) {
    if (!raw.startsWith(prefix)) continue;
    const socketId = raw.slice(prefix.length);
    if (exceptSocketId != null && socketId === exceptSocketId) continue;
    return true;
  }
  return false;
}

export function createRedisPresenceStore(client: RedisClientType): PresenceStore {
  return {
    async joinConversation(input) {
      const key = conversationKey(input.conversationId);
      const hadOther = await userHasOtherSockets(client, key, input.userId);
      await client.sAdd(key, member(input.userId, input.socketId));
      const becameViewer = !hadOther;
      return { viewers: await listUserIds(client, key), becameViewer };
    },
    async leaveConversation(input) {
      const key = conversationKey(input.conversationId);
      await client.sRem(key, member(input.userId, input.socketId));
      const stillPresent = await userHasOtherSockets(client, key, input.userId);
      const becameAbsent = !stillPresent;
      return { viewers: await listUserIds(client, key), becameAbsent };
    },
    async listConversationViewers(conversationId) {
      return listUserIds(client, conversationKey(conversationId));
    },
    async pulseWorkspace(input) {
      const key = workspaceKey(input.rootSpaceId);
      const hadOther = await userHasOtherSockets(client, key, input.userId);
      await client.sAdd(key, member(input.userId, input.socketId));
      return { becameOnline: !hadOther };
    },
    async leaveWorkspace(input) {
      const key = workspaceKey(input.rootSpaceId);
      await client.sRem(key, member(input.userId, input.socketId));
      const stillPresent = await userHasOtherSockets(client, key, input.userId);
      return { becameOffline: !stillPresent };
    },
    async listWorkspaceOnline(rootSpaceId) {
      return listUserIds(client, workspaceKey(rootSpaceId));
    },
  };
}
