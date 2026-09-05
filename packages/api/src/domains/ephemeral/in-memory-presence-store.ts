import type { ArtifactId, PresenceStore, SpaceId, UserId } from "@denser/contracts";

type ScopeSockets = Map<UserId, Set<string>>;

function createScopedPresence() {
  const byScope = new Map<string, ScopeSockets>();

  function scopeUsers(scope: string): ScopeSockets {
    let users = byScope.get(scope);
    if (!users) {
      users = new Map();
      byScope.set(scope, users);
    }
    return users;
  }

  function join(scope: string, userId: UserId, socketId: string): boolean {
    const users = scopeUsers(scope);
    let sockets = users.get(userId);
    const wasPresent = sockets != null && sockets.size > 0;
    if (!sockets) {
      sockets = new Set();
      users.set(userId, sockets);
    }
    sockets.add(socketId);
    return !wasPresent;
  }

  function leave(scope: string, userId: UserId, socketId: string): boolean {
    const users = byScope.get(scope);
    if (!users) return false;
    const sockets = users.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      users.delete(userId);
      if (users.size === 0) {
        byScope.delete(scope);
      }
      return true;
    }
    return false;
  }

  function list(scope: string): UserId[] {
    const users = byScope.get(scope);
    if (!users) return [];
    return [...users.keys()];
  }

  return { join, leave, list };
}

export function createInMemoryPresenceStore(): PresenceStore {
  const conversations = createScopedPresence();
  const workspaces = createScopedPresence();

  return {
    async joinConversation(input) {
      const becameViewer = conversations.join(input.conversationId, input.userId, input.socketId);
      return { viewers: conversations.list(input.conversationId), becameViewer };
    },
    async leaveConversation(input) {
      const becameAbsent = conversations.leave(input.conversationId, input.userId, input.socketId);
      return { viewers: conversations.list(input.conversationId), becameAbsent };
    },
    async listConversationViewers(conversationId) {
      return conversations.list(conversationId);
    },
    async pulseWorkspace(input) {
      const becameOnline = workspaces.join(input.rootSpaceId, input.userId, input.socketId);
      return { becameOnline };
    },
    async leaveWorkspace(input) {
      const becameOffline = workspaces.leave(input.rootSpaceId, input.userId, input.socketId);
      return { becameOffline };
    },
    async listWorkspaceOnline(rootSpaceId) {
      return workspaces.list(rootSpaceId);
    },
  };
}
