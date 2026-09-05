import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import {
  CONVERSATION_PRESENCE_EVENT,
  CONVERSATION_PRESENCE_PULSE_EVENT,
  CONVERSATION_PRESENCE_STOP_EVENT,
  CONVERSATION_SUBSCRIBE_EVENT,
  CONVERSATION_UNSUBSCRIBE_EVENT,
  ConversationPresencePulseInput,
  ConversationSubscribeInput,
  EMIT_TYPING_EVENT,
  EmitTypingInput,
  TYPING_EVENT,
  TYPING_TTL_MS,
  WORKSPACE_PRESENCE_EVENT,
  WORKSPACE_PRESENCE_PULSE_EVENT,
  WORKSPACE_PRESENCE_STOP_EVENT,
  WORKSPACE_PRESENCE_SUBSCRIBE_EVENT,
  WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT,
  WorkspacePresenceRootInput,
} from "@denser/contracts";
import type { DenserServer, DenserSocket } from "./attach.js";
import {
  createPresenceRegistry,
  type ConversationPresenceRegistry,
  type WorkspacePresenceRegistry,
} from "./presence-registry.js";
import { conversationRoom, workspacePresenceRoom } from "./rooms.js";
import { createTypingState } from "./typing-state.js";

export type ConversationAccess = (
  userId: UserId,
  conversationId: ArtifactId,
) => Promise<boolean>;

export type WorkspaceAccess = (userId: UserId, rootSpaceId: SpaceId) => Promise<boolean>;

export type PresenceHandlerDeps = {
  canAccessConversation: ConversationAccess;
  canAccessWorkspace: WorkspaceAccess;
};

type PresenceSocketData = DenserSocket["data"] & {
  subscribedConversations?: Set<ArtifactId>;
  viewingConversations?: Set<ArtifactId>;
  workspacePresenceRootSpaceId?: SpaceId;
};

type PresenceRuntime = {
  conversationViewers: ConversationPresenceRegistry;
  workspaceOnline: WorkspacePresenceRegistry;
  typingState: ReturnType<typeof createTypingState>;
};

function asPresenceSocket(socket: DenserSocket): DenserSocket & { data: PresenceSocketData } {
  return socket as DenserSocket & { data: PresenceSocketData };
}

function trackSet(
  current: Set<ArtifactId> | undefined,
  conversationId: ArtifactId,
): Set<ArtifactId> {
  const next = current ?? new Set();
  next.add(conversationId);
  return next;
}

function untrackSet(
  current: Set<ArtifactId> | undefined,
  conversationId: ArtifactId,
): Set<ArtifactId> | undefined {
  if (!current) return undefined;
  current.delete(conversationId);
  return current.size > 0 ? current : undefined;
}

export function createPresenceRuntime(): PresenceRuntime {
  const conversationViewers = createPresenceRegistry<ArtifactId>();
  const workspaceOnline = createPresenceRegistry<SpaceId>();
  const typingState = createTypingState({ ttlMs: TYPING_TTL_MS });
  const pruneTimer = setInterval(() => typingState.prune(), 500);
  if (typeof pruneTimer === "object" && "unref" in pruneTimer) {
    pruneTimer.unref();
  }
  return { conversationViewers, workspaceOnline, typingState };
}

export function registerPresenceHandlers(
  io: DenserServer,
  socket: DenserSocket,
  deps: PresenceHandlerDeps,
  runtime: PresenceRuntime,
): void {
  const { conversationViewers, workspaceOnline, typingState } = runtime;
  const presenceSocket = asPresenceSocket(socket);

  function emitConversationPresence(conversationId: ArtifactId): void {
    io.to(conversationRoom(conversationId)).emit(CONVERSATION_PRESENCE_EVENT, {
      conversationId,
      viewers: conversationViewers.list(conversationId),
    });
  }

  async function leaveConversationViewing(conversationId: ArtifactId): Promise<void> {
    const userId = presenceSocket.data.userId as UserId;
    const wasLast = conversationViewers.remove(conversationId, userId);
    presenceSocket.data.viewingConversations = untrackSet(
      presenceSocket.data.viewingConversations,
      conversationId,
    );
    if (wasLast) {
      emitConversationPresence(conversationId);
    }
  }

  async function leaveWorkspacePresence(rootSpaceId: SpaceId): Promise<void> {
    const userId = presenceSocket.data.userId as UserId;
    presenceSocket.leave(workspacePresenceRoom(rootSpaceId));
    const wasLast = workspaceOnline.remove(rootSpaceId, userId);
    if (wasLast) {
      io.to(workspacePresenceRoom(rootSpaceId)).emit(WORKSPACE_PRESENCE_EVENT, {
        rootSpaceId,
        userId,
        online: false,
      });
    }
  }

  presenceSocket.on(CONVERSATION_SUBSCRIBE_EVENT, async (body) => {
    const parsed = ConversationSubscribeInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { conversationId } = parsed.data;
    if (!(await deps.canAccessConversation(userId, conversationId))) return;

    await presenceSocket.join(conversationRoom(conversationId));
    presenceSocket.data.subscribedConversations = trackSet(
      presenceSocket.data.subscribedConversations,
      conversationId,
    );
  });

  presenceSocket.on(CONVERSATION_UNSUBSCRIBE_EVENT, async (body) => {
    const parsed = ConversationSubscribeInput.safeParse(body);
    if (!parsed.success) return;
    const { conversationId } = parsed.data;
    await presenceSocket.leave(conversationRoom(conversationId));
    presenceSocket.data.subscribedConversations = untrackSet(
      presenceSocket.data.subscribedConversations,
      conversationId,
    );
    await leaveConversationViewing(conversationId);
  });

  presenceSocket.on(EMIT_TYPING_EVENT, async (body) => {
    const parsed = EmitTypingInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { conversationId } = parsed.data;
    if (!(await deps.canAccessConversation(userId, conversationId))) return;

    const untilMs = typingState.record(conversationId, userId);
    presenceSocket.to(conversationRoom(conversationId)).emit(TYPING_EVENT, {
      conversationId,
      userId,
      until: new Date(untilMs).toISOString(),
    });
  });

  presenceSocket.on(CONVERSATION_PRESENCE_PULSE_EVENT, async (body) => {
    const parsed = ConversationPresencePulseInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { conversationId } = parsed.data;
    if (!(await deps.canAccessConversation(userId, conversationId))) return;

    await presenceSocket.join(conversationRoom(conversationId));
    const becameViewer = conversationViewers.add(conversationId, userId);
    presenceSocket.data.viewingConversations = trackSet(
      presenceSocket.data.viewingConversations,
      conversationId,
    );
    if (becameViewer) {
      emitConversationPresence(conversationId);
    }
  });

  presenceSocket.on(CONVERSATION_PRESENCE_STOP_EVENT, async (body) => {
    const parsed = ConversationPresencePulseInput.safeParse(body);
    if (!parsed.success) return;
    const { conversationId } = parsed.data;
    await leaveConversationViewing(conversationId);
  });

  presenceSocket.on(WORKSPACE_PRESENCE_SUBSCRIBE_EVENT, async (body) => {
    const parsed = WorkspacePresenceRootInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { rootSpaceId } = parsed.data;
    if (!(await deps.canAccessWorkspace(userId, rootSpaceId))) return;

    const prev = presenceSocket.data.workspacePresenceRootSpaceId;
    if (prev && prev !== rootSpaceId) {
      await leaveWorkspacePresence(prev);
    }

    await presenceSocket.join(workspacePresenceRoom(rootSpaceId));
    presenceSocket.data.workspacePresenceRootSpaceId = rootSpaceId;
  });

  presenceSocket.on(WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT, async (body) => {
    const parsed = WorkspacePresenceRootInput.safeParse(body);
    if (!parsed.success) return;
    const { rootSpaceId } = parsed.data;
    await leaveWorkspacePresence(rootSpaceId);
    if (presenceSocket.data.workspacePresenceRootSpaceId === rootSpaceId) {
      delete presenceSocket.data.workspacePresenceRootSpaceId;
    }
  });

  presenceSocket.on(WORKSPACE_PRESENCE_PULSE_EVENT, async (body) => {
    const parsed = WorkspacePresenceRootInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { rootSpaceId } = parsed.data;
    if (!(await deps.canAccessWorkspace(userId, rootSpaceId))) return;

    await presenceSocket.join(workspacePresenceRoom(rootSpaceId));
    presenceSocket.data.workspacePresenceRootSpaceId = rootSpaceId;
    const becameOnline = workspaceOnline.add(rootSpaceId, userId);
    if (becameOnline) {
      presenceSocket.to(workspacePresenceRoom(rootSpaceId)).emit(WORKSPACE_PRESENCE_EVENT, {
        rootSpaceId,
        userId,
        online: true,
      });
    }
  });

  presenceSocket.on(WORKSPACE_PRESENCE_STOP_EVENT, async (body) => {
    const parsed = WorkspacePresenceRootInput.safeParse(body);
    if (!parsed.success) return;
    const { rootSpaceId } = parsed.data;
    await leaveWorkspacePresence(rootSpaceId);
    if (presenceSocket.data.workspacePresenceRootSpaceId === rootSpaceId) {
      delete presenceSocket.data.workspacePresenceRootSpaceId;
    }
  });

  presenceSocket.on("disconnect", async () => {
    const viewing = presenceSocket.data.viewingConversations;
    if (viewing) {
      for (const conversationId of viewing) {
        await leaveConversationViewing(conversationId);
      }
    }
    const rootSpaceId = presenceSocket.data.workspacePresenceRootSpaceId;
    if (rootSpaceId) {
      await leaveWorkspacePresence(rootSpaceId);
      delete presenceSocket.data.workspacePresenceRootSpaceId;
    }
  });
}

export type { ConversationPresenceRegistry, WorkspacePresenceRegistry };
