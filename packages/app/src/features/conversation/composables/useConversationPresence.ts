import type { ArtifactId, SpaceMember, UserId } from "@denser/contracts";
import {
  CONVERSATION_PRESENCE_EVENT,
  CONVERSATION_PRESENCE_PULSE_EVENT,
  CONVERSATION_PRESENCE_STOP_EVENT,
  EMIT_TYPING_EVENT,
  TYPING_EVENT,
  TYPING_TTL_MS,
} from "@denser/contracts";
import { useDebounceFn, useIntervalFn } from "@vueuse/core";
import { computed, onScopeDispose, ref, watch } from "vue";
import { useConversationRoom } from "@/lib/realtime/useConversationRoom";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import {
  buildPersonRoster,
  personFromUserId,
} from "@/modules/presence/lib/person-label";
import {
  formatTypingLabel,
  formatViewerLabel,
} from "@/modules/presence/lib/format-typing-label";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";
import type { ConversationMessageView, ConversationPersonView } from "../types";

type TypingEntry = { untilMs: number };

export function useConversationPresence(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options?: {
    members?: ReadonlyRefOrGetter<readonly SpaceMember[]>;
    messages?: ReadonlyRefOrGetter<readonly ConversationMessageView[]>;
  },
) {
  const id = toReadonlyRef(conversationId);
  const members = toReadonlyRef(options?.members ?? (() => [] as readonly SpaceMember[]));
  const messages = toReadonlyRef(options?.messages ?? (() => [] as readonly ConversationMessageView[]));
  const { user } = useAuthSession();
  const { ensureSocket } = useRealtimeSocket();

  useConversationRoom(id);

  const viewerIds = ref<UserId[]>([]);
  const typingByUser = ref<Map<UserId, TypingEntry>>(new Map());
  let cancelled = false;
  let pulsingConversationId: ArtifactId | null = null;

  const roster = computed(() => buildPersonRoster(members.value, messages.value));

  function pruneTyping(now = Date.now()) {
    const next = new Map<UserId, TypingEntry>();
    for (const [userId, entry] of typingByUser.value) {
      if (entry.untilMs > now) next.set(userId, entry);
    }
    typingByUser.value = next;
  }

  function onConversationPresence(event: { conversationId: ArtifactId; viewers: UserId[] }) {
    if (event.conversationId !== id.value) return;
    viewerIds.value = event.viewers;
  }

  function onTyping(event: { conversationId: ArtifactId; userId: UserId; until: string }) {
    if (event.conversationId !== id.value) return;
    const untilMs = Date.parse(event.until);
    if (Number.isNaN(untilMs)) return;
    typingByUser.value = new Map(typingByUser.value).set(event.userId, { untilMs });
  }

  async function pulsePresence(conversation: ArtifactId) {
    const socket = await ensureSocket();
    if (cancelled || id.value !== conversation) return;
    socket.emit(CONVERSATION_PRESENCE_PULSE_EVENT, { conversationId: conversation });
    pulsingConversationId = conversation;
  }

  function stopPresence(conversation: ArtifactId) {
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    socket.emit(CONVERSATION_PRESENCE_STOP_EVENT, { conversationId: conversation });
    if (pulsingConversationId === conversation) pulsingConversationId = null;
  }

  async function attachListeners() {
    const socket = await ensureSocket();
    if (cancelled) return;
    socket.on(CONVERSATION_PRESENCE_EVENT, onConversationPresence);
    socket.on(TYPING_EVENT, onTyping);
  }

  function detachListeners() {
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    socket.off(CONVERSATION_PRESENCE_EVENT, onConversationPresence);
    socket.off(TYPING_EVENT, onTyping);
  }

  watch(
    id,
    (next, previous) => {
      viewerIds.value = [];
      typingByUser.value = new Map();
      if (previous) stopPresence(previous);
      if (next) {
        void attachListeners().then(() => {
          if (id.value === next) void pulsePresence(next);
        });
      } else {
        detachListeners();
      }
    },
    { immediate: true },
  );

  useIntervalFn(() => pruneTyping(), Math.min(TYPING_TTL_MS, 1000));

  onScopeDispose(() => {
    cancelled = true;
    if (pulsingConversationId) stopPresence(pulsingConversationId);
    detachListeners();
  });

  const otherViewerIds = computed(() =>
    viewerIds.value.filter((viewerId) => viewerId !== user.value?.id),
  );

  const viewers = computed((): ConversationPersonView[] => {
    const rosterMap = roster.value;
    return otherViewerIds.value.map((viewerId) => personFromUserId(viewerId, rosterMap));
  });

  const presenceLabel = computed(() => formatViewerLabel(otherViewerIds.value.length));

  const typingNames = computed(() => {
    const now = Date.now();
    const currentUserId = user.value?.id;
    const rosterMap = roster.value;
    return [...typingByUser.value.entries()]
      .filter(([userId, entry]) => userId !== currentUserId && entry.untilMs > now)
      .map(([userId]) => personFromUserId(userId, rosterMap).name);
  });

  const typingLabel = computed(() => formatTypingLabel(typingNames.value));

  const emitTypingPulse = useDebounceFn(async () => {
    const conversation = id.value;
    if (!conversation) return;
    const socket = await ensureSocket();
    if (cancelled || id.value !== conversation) return;
    socket.emit(EMIT_TYPING_EVENT, { conversationId: conversation });
  }, 2000, { maxWait: 2000 });

  function notifyTyping() {
    void emitTypingPulse();
  }

  function stopTyping() {
    emitTypingPulse.cancel();
    pruneTyping();
  }

  return {
    viewers,
    presenceLabel,
    typingLabel,
    notifyTyping,
    stopTyping,
  };
}
