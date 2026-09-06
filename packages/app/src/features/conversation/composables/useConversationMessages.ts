import type { InfiniteData } from "@tanstack/vue-query";
import type {
  ArtifactId,
  AttachmentDto,
  ClientId,
  AttachmentId,
  MessageDto,
  MessageId,
} from "@denser/contracts";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  REACTION_UPDATED_EVENT,
  type ReactionUpdatedEvent,
} from "@denser/contracts";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, nextTick, onScopeDispose, ref, watch } from "vue";
import { apiClient } from "@/lib/api";
import { useConversationRoom } from "@/lib/realtime/useConversationRoom";
import { useRealtimeSocket } from "@/lib/realtime/useRealtimeSocket";
import { toNextPageState, toPreviousPageState } from "@/lib/async";
import { messagesCollection, upsertInCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { useAuthSession } from "@/modules/auth/composables/useAuthSession";
import type { JSONContent } from "@/modules/rich-text";
import {
  applyMessageCreated,
  applyMessageDeleted,
  applyMessageUpdated,
  canLoadNewerMessages,
  flattenMessagePages,
  MESSAGE_MAX_PAGES,
  MESSAGE_PAGE_SIZE,
  messageIdentityKeys,
  messagesAreAlreadyKnown,
  type MessagesPageParam,
} from "../lib/message-cache";
import { applyReactionUpdated, toggleReactionOptimistic } from "../lib/reaction-cache";
import { votePollOptimistic } from "../lib/poll-cache";
import type { CreatePollInput, ListMessagesResponse, PollOptionId } from "@denser/contracts";
import { toConversationMessageView } from "../lib/toConversationMessageView";
import type { ConversationMessageView } from "../types";

type MessagesQueryData = InfiniteData<ListMessagesResponse, MessagesPageParam>;

function readMessagesQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: ArtifactId,
): MessagesQueryData | undefined {
  return queryClient.getQueryData<MessagesQueryData>(
    queryKeys.conversationMessages(conversationId),
  );
}

function createClientId(): ClientId {
  return crypto.randomUUID() as ClientId;
}

function isEmptyBody(body: JSONContent): boolean {
  const text = JSON.stringify(body);
  return text === JSON.stringify({ type: "doc", content: [] });
}

export function useConversationMessages(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options?: {
    openAnchor?: ReadonlyRefOrGetter<MessageId | null | undefined>;
  },
) {
  const id = toReadonlyRef(conversationId);
  const openAnchor = toReadonlyRef(options?.openAnchor ?? (() => null));
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const aroundFocus = ref<MessageId | null>(null);
  const failedClientId = ref<ClientId | null>(null);
  const hasAppliedOpenAnchor = ref(false);
  const reachedLiveEdge = ref(false);

  watch(id, () => {
    aroundFocus.value = null;
    failedClientId.value = null;
    hasAppliedOpenAnchor.value = false;
    reachedLiveEdge.value = false;
  });

  watch(
    openAnchor,
    (anchor) => {
      if (anchor === undefined || hasAppliedOpenAnchor.value) return;
      aroundFocus.value = anchor;
      hasAppliedOpenAnchor.value = true;
      reachedLiveEdge.value = false;
    },
    { immediate: true },
  );

  const anchorReady = computed(() => openAnchor.value !== undefined);
  const enabled = computed(() => Boolean(id.value) && anchorReady.value);
  const messagesQueryKey = computed(() => queryKeys.conversationMessages(id.value ?? ""));

  const query = useInfiniteQuery({
    queryKey: messagesQueryKey,
    enabled,
    queryFn: async ({ pageParam }: { pageParam: MessagesPageParam }) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");

      if (pageParam?.direction === "prev" && reachedLiveEdge.value) {
        return { messages: [], nextCursor: null, prevCursor: null };
      }

      const response =
        pageParam === null
          ? aroundFocus.value
            ? await apiClient.listMessages(conversation, {
                size: MESSAGE_PAGE_SIZE,
                around: aroundFocus.value,
              })
            : await apiClient.listMessages(conversation, { size: MESSAGE_PAGE_SIZE })
          : await apiClient.listMessages(conversation, {
              size: MESSAGE_PAGE_SIZE,
              cursor: pageParam.cursor,
              direction: pageParam.direction,
            });

      if (pageParam === null && !aroundFocus.value) {
        reachedLiveEdge.value = true;
      }

      upsertMany(messagesCollection, response.messages);
      return response;
    },
    initialPageParam: null as MessagesPageParam,
    getNextPageParam: (last): MessagesPageParam | undefined =>
      last.nextCursor ? { cursor: last.nextCursor, direction: "next" } : undefined,
    getPreviousPageParam: (first): MessagesPageParam | undefined => {
      if (reachedLiveEdge.value) return undefined;
      return first.prevCursor ? { cursor: first.prevCursor, direction: "prev" } : undefined;
    },
    maxPages: MESSAGE_MAX_PAGES,
  });

  watch(
    () => [query.isSuccess.value, aroundFocus.value, query.data.value?.pages.length] as const,
    ([success, focus, pageCount]) => {
      if (success && !focus && pageCount === 1) {
        reachedLiveEdge.value = true;
      }
    },
    { immediate: true },
  );

  const dtos = computed(() => flattenMessagePages(query.data.value));

  const messages = computed((): ConversationMessageView[] =>
    dtos.value
      .filter((message) => !message.deletedAt)
      .map((message) => toConversationMessageView(message, user.value)),
  );

  const previousPage = computed(() =>
    toPreviousPageState({
      hasPrevious: Boolean(query.hasNextPage.value),
      loadingPrevious: query.isFetchingNextPage.value,
    }),
  );
  const nextPage = computed(() =>
    toNextPageState({
      hasNext: canLoadNewerMessages({
        reachedLiveEdge: reachedLiveEdge.value,
        firstPagePrevCursor: query.data.value?.pages[0]?.prevCursor,
      }),
      loadingNext: query.isFetchingPreviousPage.value,
    }),
  );
  const isAtLiveEdge = computed(() => !aroundFocus.value && !nextPage.value.hasNext);
  const isLoading = computed(() => query.isLoading.value);
  const isFetching = computed(() => query.isFetching.value);
  const isSending = computed(() => sendMutation.isPending.value);
  const showJumpToLatest = computed(() => !isAtLiveEdge.value);
  const atStartOfHistory = computed(() => !previousPage.value.hasPrevious);

  async function recenterWindow() {
    const conversation = id.value;
    if (!conversation) return;
    await queryClient.cancelQueries({ queryKey: messagesQueryKey.value });
    await queryClient.resetQueries({ queryKey: messagesQueryKey.value });
  }

  function syncQueryData(next: ReturnType<typeof applyMessageCreated>) {
    if (!id.value || !next) return;
    queryClient.setQueryData(messagesQueryKey.value, next);
    upsertMany(messagesCollection, flattenMessagePages(next));
    if (!aroundFocus.value) reachedLiveEdge.value = true;
  }

  function ingestMessage(event: MessageDto) {
    if (!id.value || event.conversationId !== id.value) return;
    upsertInCollection(messagesCollection, event);
    const current = readMessagesQuery(queryClient, id.value);
    syncQueryData(applyMessageCreated(current, event));
  }

  function ingestUpdate(event: MessageDto) {
    if (!id.value || event.conversationId !== id.value) return;
    upsertInCollection(messagesCollection, event);
    const current = readMessagesQuery(queryClient, id.value);
    syncQueryData(applyMessageUpdated(current, event));
  }

  function ingestDelete(event: MessageDto) {
    if (!id.value || event.conversationId !== id.value) return;
    upsertInCollection(messagesCollection, event);
    const current = readMessagesQuery(queryClient, id.value);
    syncQueryData(applyMessageDeleted(current, event));
  }

  function ingestReaction(event: ReactionUpdatedEvent) {
    if (!id.value || event.conversationId !== id.value) return;
    const current = readMessagesQuery(queryClient, id.value);
    const next = applyReactionUpdated(current, event);
    if (!next) return;
    syncQueryData(next);
    const message = flattenMessagePages(next).find((row) => row.id === event.messageId);
    if (message) upsertInCollection(messagesCollection, message);
  }

  useConversationRoom(id);
  const { ensureSocket } = useRealtimeSocket();
  let cancelled = false;

  void ensureSocket().then((socket) => {
    if (cancelled) return;
    socket.on(MESSAGE_CREATED_EVENT, ingestMessage);
    socket.on(MESSAGE_UPDATED_EVENT, ingestUpdate);
    socket.on(MESSAGE_DELETED_EVENT, ingestDelete);
    socket.on(REACTION_UPDATED_EVENT, ingestReaction);
  });

  onScopeDispose(() => {
    cancelled = true;
    const socket = useRealtimeSocket().socket.value;
    if (!socket) return;
    socket.off(MESSAGE_CREATED_EVENT, ingestMessage);
    socket.off(MESSAGE_UPDATED_EVENT, ingestUpdate);
    socket.off(MESSAGE_DELETED_EVENT, ingestDelete);
    socket.off(REACTION_UPDATED_EVENT, ingestReaction);
  });

  const sendMutation = useMutation({
    mutationFn: async (input: {
      body: JSONContent;
      clientId: ClientId;
      attachmentIds: AttachmentId[];
      attachments: AttachmentDto[];
      poll?: CreatePollInput;
    }) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");
      return apiClient.postMessage(conversation, {
        body: input.body,
        clientId: input.clientId,
        ...(input.attachmentIds.length > 0 ? { attachmentIds: input.attachmentIds } : {}),
        ...(input.poll ? { poll: input.poll } : {}),
      });
    },
    onMutate: async (input) => {
      const conversation = id.value;
      if (!conversation || !user.value?.id) return;

      const key = messagesQueryKey.value;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = readMessagesQuery(queryClient, conversation);
      failedClientId.value = null;

      const optimistic: MessageDto = {
        id: input.clientId as unknown as MessageDto["id"],
        conversationId: conversation,
        threadId: null,
        quotesId: null,
        authorId: user.value.id as MessageDto["authorId"],
        body: input.body,
        clientId: input.clientId,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        attachmentIds: input.attachmentIds,
        attachments: input.attachments,
      };

      syncQueryData(applyMessageCreated(previous, optimistic));
      return { previous, key };
    },
    onError: (_error, input, ctx) => {
      failedClientId.value = input.clientId;
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (response) => {
      failedClientId.value = null;
      ingestMessage(response.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (input: { messageId: MessageId; body: JSONContent }) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");
      const response = await apiClient.editMessage(conversation, input.messageId, {
        body: input.body,
      });
      return response.message;
    },
    onMutate: async (input) => {
      const conversation = id.value;
      if (!conversation || !user.value?.id) return;

      const key = messagesQueryKey.value;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = readMessagesQuery(queryClient, conversation);
      const current = dtos.value.find((message) => message.id === input.messageId);
      if (!current) return { previous, key };

      const optimistic: MessageDto = {
        ...current,
        body: input.body,
        editedAt: new Date().toISOString(),
      };

      syncQueryData(applyMessageUpdated(previous, optimistic));
      return { previous, key };
    },
    onError: (_error, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (message) => {
      ingestUpdate(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: MessageId) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");
      const response = await apiClient.deleteMessage(conversation, messageId);
      return response.message;
    },
    onMutate: async (messageId) => {
      const conversation = id.value;
      if (!conversation) return;

      const key = messagesQueryKey.value;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = readMessagesQuery(queryClient, conversation);
      const current = dtos.value.find((message) => message.id === messageId);
      if (!current) return { previous, key };

      const optimistic: MessageDto = {
        ...current,
        deletedAt: new Date().toISOString(),
      };

      syncQueryData(applyMessageDeleted(previous, optimistic));
      return { previous, key };
    },
    onError: (_error, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (message) => {
      ingestDelete(message);
    },
  });

  async function send(
    body: JSONContent,
    attachmentIds: AttachmentId[] = [],
    attachments: AttachmentDto[] = [],
    poll?: CreatePollInput,
  ) {
    if (isEmptyBody(body) && attachmentIds.length === 0 && !poll) return;
    await sendMutation.mutateAsync({ body, attachmentIds, attachments, poll, clientId: createClientId() });
  }

  async function retrySend() {
    if (!failedClientId.value) return;
    const current = dtos.value.find((message) => message.clientId === failedClientId.value);
    if (!current?.body) return;
    await sendMutation.mutateAsync({
      body: current.body as JSONContent,
      attachmentIds: (current.attachmentIds ?? []) as AttachmentId[],
      attachments: current.attachments ?? [],
      clientId: failedClientId.value,
    });
  }

  async function jumpAround(messageId: MessageId) {
    if (!id.value) return;
    hasAppliedOpenAnchor.value = true;
    aroundFocus.value = messageId;
    reachedLiveEdge.value = false;
    await nextTick();
    await recenterWindow();
  }

  async function jumpToLatest() {
    if (!id.value) return;
    hasAppliedOpenAnchor.value = true;
    aroundFocus.value = null;
    reachedLiveEdge.value = true;
    await nextTick();
    await recenterWindow();
  }

  async function edit(messageId: MessageId, body: JSONContent) {
    if (isEmptyBody(body)) return;
    await editMutation.mutateAsync({ messageId, body });
  }

  async function remove(messageId: MessageId) {
    await deleteMutation.mutateAsync(messageId);
  }

  async function toggleReaction(messageId: MessageId, emoji: string) {
    const conversation = id.value;
    if (!conversation) return;

    const key = messagesQueryKey.value;
    await queryClient.cancelQueries({ queryKey: key });
    const previous = readMessagesQuery(queryClient, conversation);
    const current = dtos.value.find((message) => message.id === messageId);
    if (!current) return;

    const optimistic: MessageDto = {
      ...current,
      reactions: toggleReactionOptimistic(current.reactions, emoji),
    };
    syncQueryData(applyMessageUpdated(previous, optimistic));

    try {
      const response = await apiClient.toggleReaction(conversation, messageId, { emoji });
      ingestReaction({
        conversationId: conversation,
        messageId,
        reactions: response.reactions,
      });
    } catch (error) {
      if (previous) queryClient.setQueryData(key, previous);
      throw error;
    }
  }

  async function votePoll(messageId: MessageId, optionId: PollOptionId) {
    const conversation = id.value;
    if (!conversation) return;

    const key = queryKeys.conversationMessages(conversation);
    await queryClient.cancelQueries({ queryKey: key });
    const previous = readMessagesQuery(queryClient, conversation);
    const current = dtos.value.find((message) => message.id === messageId);
    if (!current) return;

    const optimistic: MessageDto = {
      ...current,
      poll: votePollOptimistic(current.poll, optionId),
    };
    syncQueryData(applyMessageUpdated(previous, optimistic));

    try {
      const response = await apiClient.votePoll(conversation, messageId, { optionId });
      ingestUpdate({ ...current, poll: response.poll });
    } catch (error) {
      if (previous) queryClient.setQueryData(key, previous);
      throw error;
    }
  }

  return {
    messages,
    isLoading,
    isFetching,
    isSending,
    isEditing: computed(() => editMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value),
    previousPage,
    nextPage,
    isAtLiveEdge,
    atStartOfHistory,
    showJumpToLatest,
    failed: computed(() => failedClientId.value != null),
    loadPrevious: () => query.fetchNextPage(),
    loadNext: async () => {
      if (reachedLiveEdge.value) return;
      const knownKeys = new Set(dtos.value.flatMap((message) => messageIdentityKeys(message)));
      const result = await query.fetchPreviousPage();
      const prepended = result.data?.pages[0]?.messages ?? [];
      if (
        prepended.length === 0 ||
        prepended.length < MESSAGE_PAGE_SIZE ||
        messagesAreAlreadyKnown(prepended, knownKeys)
      ) {
        reachedLiveEdge.value = true;
      }
    },
    jumpAround,
    jumpToLatest,
    send,
    edit,
    remove,
    toggleReaction,
    votePoll,
    retrySend,
    reload: () => query.refetch(),
  };
}
