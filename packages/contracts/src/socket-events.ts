import {
  CONVERSATION_PRESENCE_EVENT,
  CONVERSATION_PRESENCE_PULSE_EVENT,
  CONVERSATION_PRESENCE_STOP_EVENT,
  CONVERSATION_SUBSCRIBE_EVENT,
  CONVERSATION_UNSUBSCRIBE_EVENT,
  ConversationPresenceEvent,
  ConversationPresencePulseInput,
  ConversationSubscribeInput,
  EMIT_TYPING_EVENT,
  EmitTypingInput,
  TYPING_EVENT,
  TypingEvent,
  WORKSPACE_PRESENCE_EVENT,
  WORKSPACE_PRESENCE_PULSE_EVENT,
  WORKSPACE_PRESENCE_SNAPSHOT_EVENT,
  WORKSPACE_PRESENCE_STOP_EVENT,
  WORKSPACE_PRESENCE_SUBSCRIBE_EVENT,
  WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT,
  WorkspacePresenceEvent,
  WorkspacePresenceSnapshotEvent,
  WorkspacePresenceRootInput,
} from "./presence.js";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  MessageDto,
} from "./message.js";
import { REACTION_UPDATED_EVENT, ReactionUpdatedEvent } from "./reaction.js";
import {
  SCHEDULED_MESSAGE_CANCELLED_EVENT,
  SCHEDULED_MESSAGE_UPSERTED_EVENT,
} from "./scheduled-message.js";
import type {
  ScheduledMessageCancelledEvent,
  ScheduledMessageUpsertedEvent,
} from "./scheduled-message.js";
import { z } from "zod";

export const ReadyEvent = z.object({
  ok: z.literal(true),
  room: z.string(),
});
export type ReadyEvent = z.infer<typeof ReadyEvent>;

export type ServerToClientEvents = {
  ready: (payload: ReadyEvent) => void;
  [MESSAGE_CREATED_EVENT]: (payload: MessageDto) => void;
  [MESSAGE_UPDATED_EVENT]: (payload: MessageDto) => void;
  [MESSAGE_DELETED_EVENT]: (payload: MessageDto) => void;
  [REACTION_UPDATED_EVENT]: (payload: ReactionUpdatedEvent) => void;
  [TYPING_EVENT]: (payload: TypingEvent) => void;
  [CONVERSATION_PRESENCE_EVENT]: (payload: ConversationPresenceEvent) => void;
  [WORKSPACE_PRESENCE_EVENT]: (payload: WorkspacePresenceEvent) => void;
  [WORKSPACE_PRESENCE_SNAPSHOT_EVENT]: (payload: WorkspacePresenceSnapshotEvent) => void;
  [SCHEDULED_MESSAGE_UPSERTED_EVENT]: (payload: ScheduledMessageUpsertedEvent) => void;
  [SCHEDULED_MESSAGE_CANCELLED_EVENT]: (payload: ScheduledMessageCancelledEvent) => void;
};

export type ClientToServerEvents = {
  [CONVERSATION_SUBSCRIBE_EVENT]: (body: ConversationSubscribeInput) => void;
  [CONVERSATION_UNSUBSCRIBE_EVENT]: (body: ConversationSubscribeInput) => void;
  [EMIT_TYPING_EVENT]: (body: EmitTypingInput) => void;
  [CONVERSATION_PRESENCE_PULSE_EVENT]: (body: ConversationPresencePulseInput) => void;
  [CONVERSATION_PRESENCE_STOP_EVENT]: (body: ConversationPresencePulseInput) => void;
  [WORKSPACE_PRESENCE_SUBSCRIBE_EVENT]: (body: WorkspacePresenceRootInput) => void;
  [WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT]: (body: WorkspacePresenceRootInput) => void;
  [WORKSPACE_PRESENCE_PULSE_EVENT]: (body: WorkspacePresenceRootInput) => void;
  [WORKSPACE_PRESENCE_STOP_EVENT]: (body: WorkspacePresenceRootInput) => void;
};

export type ServerEventPayload<E extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[E]
>[0];
