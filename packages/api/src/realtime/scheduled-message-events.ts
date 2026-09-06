import type {
  ArtifactId,
  ScheduledMessageCancelledEvent,
  ScheduledMessageUpsertedEvent,
} from "@denser/contracts";
import {
  SCHEDULED_MESSAGE_CANCELLED_EVENT,
  SCHEDULED_MESSAGE_UPSERTED_EVENT,
} from "@denser/contracts";
import type { DenserServer } from "./attach.js";
import { conversationRoom } from "./rooms.js";

let server: DenserServer | null = null;

export function bindScheduledMessageRealtime(io: DenserServer): void {
  server = io;
}

export function emitScheduledMessageUpserted(payload: ScheduledMessageUpsertedEvent): void {
  if (!server) return;
  server
    .to(conversationRoom(payload.conversationId))
    .emit(SCHEDULED_MESSAGE_UPSERTED_EVENT, payload);
}

export function emitScheduledMessageCancelled(payload: ScheduledMessageCancelledEvent): void {
  if (!server) return;
  server
    .to(conversationRoom(payload.conversationId))
    .emit(SCHEDULED_MESSAGE_CANCELLED_EVENT, payload);
}
