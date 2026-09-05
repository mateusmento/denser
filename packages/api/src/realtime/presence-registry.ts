import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";

type RefCountedUsers = Map<UserId, number>;

/**
 * Tracks how many active sockets each user has for a scoped presence signal.
 * Multi-tab users stay present until their last socket leaves.
 */
export function createPresenceRegistry<TScope extends string>() {
  const byScope = new Map<TScope, RefCountedUsers>();

  function add(scope: TScope, userId: UserId): boolean {
    let users = byScope.get(scope);
    if (!users) {
      users = new Map();
      byScope.set(scope, users);
    }
    const next = (users.get(userId) ?? 0) + 1;
    users.set(userId, next);
    return next === 1;
  }

  function remove(scope: TScope, userId: UserId): boolean {
    const users = byScope.get(scope);
    if (!users) return false;
    const count = users.get(userId);
    if (count == null) return false;
    if (count <= 1) {
      users.delete(userId);
      if (users.size === 0) {
        byScope.delete(scope);
      }
      return true;
    }
    users.set(userId, count - 1);
    return false;
  }

  function list(scope: TScope): UserId[] {
    const users = byScope.get(scope);
    if (!users) return [];
    return [...users.keys()];
  }

  function has(scope: TScope, userId: UserId): boolean {
    return (byScope.get(scope)?.get(userId) ?? 0) > 0;
  }

  return { add, remove, list, has };
}

export type ConversationPresenceRegistry = ReturnType<typeof createPresenceRegistry<ArtifactId>>;
export type WorkspacePresenceRegistry = ReturnType<typeof createPresenceRegistry<SpaceId>>;
