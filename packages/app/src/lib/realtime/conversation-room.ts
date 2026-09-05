import type { ArtifactId } from "@denser/contracts";
import { CONVERSATION_SUBSCRIBE_EVENT, CONVERSATION_UNSUBSCRIBE_EVENT } from "@denser/contracts";
import type { DenserSocket } from "@denser/api-client";

const subscribers = new Map<ArtifactId, number>();

export function joinConversationRoom(socket: DenserSocket, conversationId: ArtifactId): void {
  const count = subscribers.get(conversationId) ?? 0;
  subscribers.set(conversationId, count + 1);
  if (count === 0) {
    socket.emit(CONVERSATION_SUBSCRIBE_EVENT, { conversationId });
  }
}

export function leaveConversationRoom(socket: DenserSocket, conversationId: ArtifactId): void {
  const count = subscribers.get(conversationId) ?? 0;
  if (count <= 1) {
    subscribers.delete(conversationId);
    socket.emit(CONVERSATION_UNSUBSCRIBE_EVENT, { conversationId });
    return;
  }
  subscribers.set(conversationId, count - 1);
}
