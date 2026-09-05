import { z } from "zod";
import { ArtifactId, SpaceId, UserId } from "./ids.js";

/** Client → server: {@link EmitTypingInput} on {@link EMIT_TYPING_EVENT}. */
export const EMIT_TYPING_EVENT = "typing.emit" as const;

/** Server → client: ephemeral typing pulse with expiry. */
export const TYPING_EVENT = "typing" as const;

/** Server → client: who is viewing this conversation. */
export const CONVERSATION_PRESENCE_EVENT = "conversation.presence" as const;

/** Server → client: workspace online/offline for a user. */
export const WORKSPACE_PRESENCE_EVENT = "workspace.presence" as const;

export const CONVERSATION_SUBSCRIBE_EVENT = "conversation.subscribe" as const;
export const CONVERSATION_UNSUBSCRIBE_EVENT = "conversation.unsubscribe" as const;
export const CONVERSATION_PRESENCE_PULSE_EVENT = "conversation.presence.pulse" as const;
export const CONVERSATION_PRESENCE_STOP_EVENT = "conversation.presence.stop" as const;
export const WORKSPACE_PRESENCE_SUBSCRIBE_EVENT = "workspace.presence.subscribe" as const;
export const WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT = "workspace.presence.unsubscribe" as const;
export const WORKSPACE_PRESENCE_PULSE_EVENT = "workspace.presence.pulse" as const;
export const WORKSPACE_PRESENCE_STOP_EVENT = "workspace.presence.stop" as const;

export const EmitTypingInput = z.object({
  conversationId: ArtifactId,
});
export type EmitTypingInput = z.infer<typeof EmitTypingInput>;

export const ConversationSubscribeInput = z.object({
  conversationId: ArtifactId,
});
export type ConversationSubscribeInput = z.infer<typeof ConversationSubscribeInput>;

export const ConversationPresencePulseInput = z.object({
  conversationId: ArtifactId,
});
export type ConversationPresencePulseInput = z.infer<typeof ConversationPresencePulseInput>;

export const WorkspacePresenceRootInput = z.object({
  rootSpaceId: SpaceId,
});
export type WorkspacePresenceRootInput = z.infer<typeof WorkspacePresenceRootInput>;

export const TypingEvent = z.object({
  conversationId: ArtifactId,
  userId: UserId,
  until: z.string(),
});
export type TypingEvent = z.infer<typeof TypingEvent>;

export const ConversationPresenceEvent = z.object({
  conversationId: ArtifactId,
  viewers: z.array(UserId),
});
export type ConversationPresenceEvent = z.infer<typeof ConversationPresenceEvent>;

export const WorkspacePresenceEvent = z.object({
  rootSpaceId: SpaceId,
  userId: UserId,
  online: z.boolean(),
});
export type WorkspacePresenceEvent = z.infer<typeof WorkspacePresenceEvent>;

/** Default typing TTL (ms) — receiver drops user when `until` passes. */
export const TYPING_TTL_MS = 5_500;
