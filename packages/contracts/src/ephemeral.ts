import type { ArtifactId, SpaceId, UserId } from "./ids.js";

/** Ephemeral typing indicators — TTL rows, not durable. */
export type TypingStore = {
  pulse(input: { conversationId: ArtifactId; userId: UserId; ttlMs: number }): Promise<{ until: string }>;
  listActive(conversationId: ArtifactId): Promise<Array<{ userId: UserId; until: string }>>;
};

/** Conversation viewers + workspace online — ref-counted per socket within a scope. */
export type PresenceStore = {
  joinConversation(input: {
    conversationId: ArtifactId;
    userId: UserId;
    socketId: string;
  }): Promise<{ viewers: UserId[]; becameViewer: boolean }>;
  leaveConversation(input: {
    conversationId: ArtifactId;
    userId: UserId;
    socketId: string;
  }): Promise<{ viewers: UserId[]; becameAbsent: boolean }>;
  listConversationViewers(conversationId: ArtifactId): Promise<UserId[]>;

  pulseWorkspace(input: {
    rootSpaceId: SpaceId;
    userId: UserId;
    socketId: string;
  }): Promise<{ becameOnline: boolean }>;
  leaveWorkspace(input: {
    rootSpaceId: SpaceId;
    userId: UserId;
    socketId: string;
  }): Promise<{ becameOffline: boolean }>;
  listWorkspaceOnline(rootSpaceId: SpaceId): Promise<UserId[]>;
};
