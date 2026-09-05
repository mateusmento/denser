import type { ArtifactId, MessageDto, ReactionUpdatedEvent } from "@denser/contracts";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  REACTION_UPDATED_EVENT,
} from "@denser/contracts";
import type { DenserServer } from "./attach.js";
import { conversationRoom } from "./rooms.js";

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

export function emitReactionUpdated(payload: ReactionUpdatedEvent): void {
  if (!server) return;
  server.to(conversationRoom(payload.conversationId)).emit(REACTION_UPDATED_EVENT, payload);
}

export { conversationRoom, userRoom, workspacePresenceRoom } from "./rooms.js";
