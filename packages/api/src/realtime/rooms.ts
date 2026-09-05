import type { ArtifactId, SpaceId } from "@denser/contracts";

export function conversationRoom(conversationId: ArtifactId): string {
  return `conversation:${conversationId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function workspacePresenceRoom(rootSpaceId: SpaceId): string {
  return `workspace:${rootSpaceId}:presence`;
}
