import type { InfiniteData } from "@tanstack/vue-query";
import type { ArtifactId, ClientId, MessageDto, MessageId } from "@denser/contracts";
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_UPDATED_EVENT,
  REACTION_UPDATED_EVENT,
  CONVERSATION_SUBSCRIBE_EVENT,
  CONVERSATION_UNSUBSCRIBE_EVENT,
} from "@denser/contracts";
import type { ReactionUpdatedEvent } from "@denser/contracts";
import type { DenserSocket } from "@denser/api-client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { apiClient } from "@/lib/api";
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
import { applyReactionUpdated } from "../lib/reaction-cache";
import type { ListMessagesResponse } from "@denser/contracts";
import { toConversationMessageView } from "../lib/toConversationMessageView";
import type { ConversationMessageView, ConversationThreadView } from "../types";

type ThreadMessagesQueryData = InfiniteData<ListMessagesResponse, MessagesPageParam>;

function readThreadMessagesQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: ArtifactId,
  threadId: MessageId,
): ThreadMessagesQueryData | undefined {
  return queryClient.getQueryData<ThreadMessagesQueryData>(
    queryKeys.threadMessages(conversationId, threadId),
  );
}

function createClientId(): ClientId {
  return crypto.randomUUID() as ClientId;
}

function isEmptyBody(body: JSONContent): boolean {
  const text = JSON.stringify(body);
  return text === JSON.stringify({ type: "doc", content: [] });
}

export function useThreadMessages(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  threadId: ReadonlyRefOrGetter<MessageId | null | undefined>,
  parentMessage: ReadonlyRefOrGetter<ConversationMessageView | undefined>,
) {
  const conversation = toReadonlyRef(conversationId);
  const thread = toReadonlyRef(threadId);
  const parent = toReadonlyRef(parentMessage);
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const failedClientId = ref<ClientId | null>(null);
  const reachedLiveEdge = ref(true);

  watch(thread, () => {
    failedClientId.value = null;
    reachedLiveEdge.value = true;
  });

  const enabled = computed(() => Boolean(conversation.value && thread.value));

  const query = useInfiniteQuery({
    queryKey: computed(() =>
      queryKeys.threadMessages(conversation.value ?? "", thread.value ?? ""),
    ),
    enabled,
    queryFn: async ({ pageParam }: { pageParam: MessagesPageParam }) => {
      const conversationIdValue = conversation.value;
      const threadIdValue = thread.value;
      if (!conversationIdValue || !threadIdValue) throw new Error("no thread");

      if (pageParam?.direction === "prev" && reachedLiveEdge.value) {
        return { messages: [], nextCursor: null, prevCursor: null };
      }

      const response =
        pageParam === null
          ? await apiClient.listThreadMessages(conversationIdValue, threadIdValue, {
              size: MESSAGE_PAGE_SIZE,
            })
          : await apiClient.listThreadMessages(conversationIdValue, threadIdValue, {
              size: MESSAGE_PAGE_SIZE,
              cursor: pageParam.cursor,
              direction: pageParam.direction,
            });

      if (pageParam === null) {
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
    () => [query.isSuccess.value, query.data.value?.pages.length] as const,
    ([success, pageCount]) => {
      if (success && pageCount === 1) {
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

  const threadView = computed((): ConversationThreadView | null => {
    if (!parent.value) return null;
    return {
      parent: parent.value,
      messages: messages.value,
    };
  });

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
  const isLoading = computed(() => query.isLoading.value);
  const isSending = computed(() => sendMutation.isPending.value);
  const showJumpToLatest = computed(() => nextPage.value.hasNext);

  function syncQueryData(next: ReturnType<typeof applyMessageCreated>) {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue || !next) return;
    queryClient.setQueryData(queryKeys.threadMessages(conversationIdValue, threadIdValue), next);
    upsertMany(messagesCollection, flattenMessagePages(next));
    reachedLiveEdge.value = true;
  }

  function ingestMessage(event: MessageDto) {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue) return;
    if (event.conversationId !== conversationIdValue || event.threadId !== threadIdValue) return;
    upsertInCollection(messagesCollection, event);
    const current = readThreadMessagesQuery(queryClient, conversationIdValue, threadIdValue);
    syncQueryData(applyMessageCreated(current, event));
  }

  function ingestUpdate(event: MessageDto) {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue) return;
    if (event.conversationId !== conversationIdValue || event.threadId !== threadIdValue) return;
    upsertInCollection(messagesCollection, event);
    const current = readThreadMessagesQuery(queryClient, conversationIdValue, threadIdValue);
    syncQueryData(applyMessageUpdated(current, event));
  }

  function ingestDelete(event: MessageDto) {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue) return;
    if (event.conversationId !== conversationIdValue || event.threadId !== threadIdValue) return;
    upsertInCollection(messagesCollection, event);
    const current = readThreadMessagesQuery(queryClient, conversationIdValue, threadIdValue);
    syncQueryData(applyMessageDeleted(current, event));
  }

  function ingestReaction(event: ReactionUpdatedEvent) {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue || event.conversationId !== conversationIdValue) return;
    const current = readThreadMessagesQuery(queryClient, conversationIdValue, threadIdValue);
    const next = applyReactionUpdated(current, event);
    if (!next) return;
    syncQueryData(next);
    const message = flattenMessagePages(next).find((row) => row.id === event.messageId);
    if (message) upsertInCollection(messagesCollection, message);
  }

  let socket: DenserSocket | null = null;
  let cancelled = false;

  onMounted(() => {
    void apiClient.connectRealtime().then((connected) => {
      if (cancelled) return;
      socket = connected;
      socket.on(MESSAGE_CREATED_EVENT, ingestMessage);
      socket.on(MESSAGE_UPDATED_EVENT, ingestUpdate);
      socket.on(MESSAGE_DELETED_EVENT, ingestDelete);
      socket.on(REACTION_UPDATED_EVENT, ingestReaction);
      if (conversation.value) {
        socket.emit(CONVERSATION_SUBSCRIBE_EVENT, { conversationId: conversation.value });
      }
    });
  });

  watch(conversation, (conversationId, previous) => {
    if (!socket) return;
    if (previous) {
      socket.emit(CONVERSATION_UNSUBSCRIBE_EVENT, { conversationId: previous });
    }
    if (conversationId) {
      socket.emit(CONVERSATION_SUBSCRIBE_EVENT, { conversationId });
    }
  });

  onUnmounted(() => {
    cancelled = true;
    if (!socket) return;
    if (conversation.value) {
      socket.emit(CONVERSATION_UNSUBSCRIBE_EVENT, { conversationId: conversation.value });
    }
    socket.off(MESSAGE_CREATED_EVENT, ingestMessage);
    socket.off(MESSAGE_UPDATED_EVENT, ingestUpdate);
    socket.off(MESSAGE_DELETED_EVENT, ingestDelete);
    socket.off(REACTION_UPDATED_EVENT, ingestReaction);
  });

  const sendMutation = useMutation({
    mutationFn: async (input: { body: JSONContent; clientId: ClientId }) => {
      const conversationIdValue = conversation.value;
      const threadIdValue = thread.value;
      if (!conversationIdValue || !threadIdValue) throw new Error("no thread");
      return apiClient.postMessage(conversationIdValue, {
        body: input.body,
        clientId: input.clientId,
        threadId: threadIdValue,
      });
    },
    onMutate: async (input) => {
      const conversationIdValue = conversation.value;
      const threadIdValue = thread.value;
      if (!conversationIdValue || !threadIdValue || !user.value?.id) return;

      const key = queryKeys.threadMessages(conversationIdValue, threadIdValue);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = readThreadMessagesQuery(queryClient, conversationIdValue, threadIdValue);
      failedClientId.value = null;

      const optimistic: MessageDto = {
        id: input.clientId as unknown as MessageDto["id"],
        conversationId: conversationIdValue,
        threadId: threadIdValue,
        quotesId: null,
        authorId: user.value.id as MessageDto["authorId"],
        body: input.body,
        clientId: input.clientId,
        createdAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        attachmentIds: [],
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

  async function send(body: JSONContent) {
    if (isEmptyBody(body)) return;
    await sendMutation.mutateAsync({ body, clientId: createClientId() });
  }

  async function retrySend() {
    if (!failedClientId.value) return;
    const current = dtos.value.find((message) => message.clientId === failedClientId.value);
    if (!current?.body) return;
    await sendMutation.mutateAsync({
      body: current.body as JSONContent,
      clientId: failedClientId.value,
    });
  }

  async function jumpToLatest() {
    const conversationIdValue = conversation.value;
    const threadIdValue = thread.value;
    if (!conversationIdValue || !threadIdValue) return;
    reachedLiveEdge.value = true;
    await queryClient.resetQueries({
      queryKey: queryKeys.threadMessages(conversationIdValue, threadIdValue),
    });
    await query.refetch();
  }

  return {
    thread: threadView,
    isLoading,
    isSending,
    previousPage,
    nextPage,
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
    jumpToLatest,
    send,
    retrySend,
    reload: () => query.refetch(),
  };
}
