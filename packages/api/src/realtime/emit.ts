import type { ArtifactId, MessageDto } from "@denser/contracts";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
} from "@denser/contracts";
import type { DenserServer } from "./attach.js";

export function conversationRoom(conversationId: ArtifactId): string {
  return `conversation:${conversationId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

let server: DenserServer | null = null;

export function bindRealtimeServer(io: DenserServer): void {
  server = io;
}

/** Emit a message event to the room for a conversation. No-ops when realtime is not attached. */
export function emitConversationEvent(
  conversationId: ArtifactId,
  event: "created" | "updated" | "deleted",
  payload: MessageDto,
): void {
  if (!server) return;
  const room = conversationRoom(conversationId);
  switch (event) {
    case "created":
      server.to(room).emit(MESSAGE_CREATED_EVENT, payload);
      break;
    case "updated":
      server.to(room).emit(MESSAGE_UPDATED_EVENT, payload);
      break;
    case "deleted":
      server.to(room).emit(MESSAGE_DELETED_EVENT, payload);
      break;
  }
}