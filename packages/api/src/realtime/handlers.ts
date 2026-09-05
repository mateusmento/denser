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
  WORKSPACE_PRESENCE_SNAPSHOT_EVENT,
  WORKSPACE_PRESENCE_STOP_EVENT,
  WORKSPACE_PRESENCE_SUBSCRIBE_EVENT,
  WORKSPACE_PRESENCE_UNSUBSCRIBE_EVENT,
  WorkspacePresenceRootInput,
} from "@denser/contracts";
import { getPort } from "../ports/container.js";
import type { DenserServer, DenserSocket } from "./attach.js";
import { conversationRoom, workspacePresenceRoom } from "./rooms.js";

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

export function registerPresenceHandlers(
  io: DenserServer,
  socket: DenserSocket,
  deps: PresenceHandlerDeps,
): void {
  const typingStore = getPort("typingStore");
  const presenceStore = getPort("presenceStore");
  const presenceSocket = asPresenceSocket(socket);

  function emitConversationPresence(conversationId: ArtifactId, viewers: UserId[]): void {
    io.to(conversationRoom(conversationId)).emit(CONVERSATION_PRESENCE_EVENT, {
      conversationId,
      viewers,
    });
  }

  async function leaveConversationViewing(conversationId: ArtifactId): Promise<void> {
    const userId = presenceSocket.data.userId as UserId;
    const { viewers, becameAbsent } = await presenceStore.leaveConversation({
      conversationId,
      userId,
      socketId: presenceSocket.id,
    });
    presenceSocket.data.viewingConversations = untrackSet(
      presenceSocket.data.viewingConversations,
      conversationId,
    );
    if (becameAbsent) {
      emitConversationPresence(conversationId, viewers);
    }
  }

  async function leaveWorkspacePresence(rootSpaceId: SpaceId): Promise<void> {
    const userId = presenceSocket.data.userId as UserId;
    presenceSocket.leave(workspacePresenceRoom(rootSpaceId));
    const { becameOffline } = await presenceStore.leaveWorkspace({
      rootSpaceId,
      userId,
      socketId: presenceSocket.id,
    });
    if (becameOffline) {
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

    const { until } = await typingStore.pulse({
      conversationId,
      userId,
      ttlMs: TYPING_TTL_MS,
    });
    presenceSocket.to(conversationRoom(conversationId)).emit(TYPING_EVENT, {
      conversationId,
      userId,
      until,
    });
  });

  presenceSocket.on(CONVERSATION_PRESENCE_PULSE_EVENT, async (body) => {
    const parsed = ConversationPresencePulseInput.safeParse(body);
    if (!parsed.success) return;
    const userId = presenceSocket.data.userId as UserId;
    const { conversationId } = parsed.data;
    if (!(await deps.canAccessConversation(userId, conversationId))) return;

    await presenceSocket.join(conversationRoom(conversationId));
    const { becameViewer, viewers } = await presenceStore.joinConversation({
      conversationId,
      userId,
      socketId: presenceSocket.id,
    });
    presenceSocket.data.viewingConversations = trackSet(
      presenceSocket.data.viewingConversations,
      conversationId,
    );
    if (becameViewer) {
      emitConversationPresence(conversationId, viewers);
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

    presenceSocket.emit(WORKSPACE_PRESENCE_SNAPSHOT_EVENT, {
      rootSpaceId,
      userIds: await presenceStore.listWorkspaceOnline(rootSpaceId),
    });
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
    const { becameOnline } = await presenceStore.pulseWorkspace({
      rootSpaceId,
      userId,
      socketId: presenceSocket.id,
    });
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
