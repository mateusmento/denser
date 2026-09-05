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
  CONVERSATION_SUBSCRIBE_EVENT,
  CONVERSATION_UNSUBSCRIBE_EVENT,
} from "@denser/contracts";
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
  flattenMessagePages,
  MESSAGE_MAX_PAGES,
  MESSAGE_PAGE_SIZE,
  type MessagesPageParam,
} from "../lib/message-cache";
import type { ListMessagesResponse } from "@denser/contracts";
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
) {
  const id = toReadonlyRef(conversationId);
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const aroundFocus = ref<MessageId | null>(null);
  const failedClientId = ref<ClientId | null>(null);

  watch(id, () => {
    aroundFocus.value = null;
    failedClientId.value = null;
  });

  const enabled = computed(() => Boolean(id.value));

  const query = useInfiniteQuery({
    queryKey: computed(() => queryKeys.conversationMessages(id.value ?? "")),
    enabled,
    queryFn: async ({ pageParam }: { pageParam: MessagesPageParam }) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");

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

      upsertMany(messagesCollection, response.messages);
      return response;
    },
    initialPageParam: null as MessagesPageParam,
    getNextPageParam: (last): MessagesPageParam | undefined =>
      last.nextCursor ? { cursor: last.nextCursor, direction: "next" } : undefined,
    getPreviousPageParam: (first): MessagesPageParam | undefined =>
      first.prevCursor ? { cursor: first.prevCursor, direction: "prev" } : undefined,
    maxPages: MESSAGE_MAX_PAGES,
  });

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
      hasNext: Boolean(query.hasPreviousPage.value),
      loadingNext: query.isFetchingPreviousPage.value,
    }),
  );
  const isAtLiveEdge = computed(() => !aroundFocus.value && !nextPage.value.hasNext);
  const isLoading = computed(() => query.isLoading.value);
  const isSending = computed(() => sendMutation.isPending.value);
  const showJumpToLatest = computed(() => !isAtLiveEdge.value);

  function syncQueryData(next: ReturnType<typeof applyMessageCreated>) {
    if (!id.value || !next) return;
    queryClient.setQueryData(queryKeys.conversationMessages(id.value), next);
    upsertMany(messagesCollection, flattenMessagePages(next));
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

  let socket: DenserSocket | null = null;
  let cancelled = false;

  onMounted(() => {
    void apiClient.connectRealtime().then((connected) => {
      if (cancelled) return;
      socket = connected;
      socket.on(MESSAGE_CREATED_EVENT, ingestMessage);
      socket.on(MESSAGE_UPDATED_EVENT, ingestUpdate);
      socket.on(MESSAGE_DELETED_EVENT, ingestDelete);
      if (id.value) {
        socket.emit(CONVERSATION_SUBSCRIBE_EVENT, { conversationId: id.value });
      }
    });
  });

  watch(id, (conversationId, previous) => {
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
    if (id.value) {
      socket.emit(CONVERSATION_UNSUBSCRIBE_EVENT, { conversationId: id.value });
    }
    socket.off(MESSAGE_CREATED_EVENT, ingestMessage);
    socket.off(MESSAGE_UPDATED_EVENT, ingestUpdate);
    socket.off(MESSAGE_DELETED_EVENT, ingestDelete);
  });

  const sendMutation = useMutation({
    mutationFn: async (input: {
      body: JSONContent;
      clientId: ClientId;
      attachmentIds: AttachmentId[];
      attachments: AttachmentDto[];
    }) => {
      const conversation = id.value;
      if (!conversation) throw new Error("no conversation");
      return apiClient.postMessage(conversation, {
        body: input.body,
        clientId: input.clientId,
        ...(input.attachmentIds.length > 0 ? { attachmentIds: input.attachmentIds } : {}),
      });
    },
    onMutate: async (input) => {
      const conversation = id.value;
      if (!conversation || !user.value?.id) return;

      const key = queryKeys.conversationMessages(conversation);
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

  async function send(
    body: JSONContent,
    attachmentIds: AttachmentId[] = [],
    attachments: AttachmentDto[] = [],
  ) {
    if (isEmptyBody(body) && attachmentIds.length === 0) return;
    await sendMutation.mutateAsync({ body, attachmentIds, attachments, clientId: createClientId() });
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
    const conversation = id.value;
    if (!conversation) return;
    aroundFocus.value = messageId;
    const page = await apiClient.listMessages(conversation, {
      size: MESSAGE_PAGE_SIZE,
      around: messageId,
    });
    upsertMany(messagesCollection, page.messages);
    queryClient.setQueryData(queryKeys.conversationMessages(conversation), {
      pages: [page],
      pageParams: [null],
    });
  }

  async function jumpToLatest() {
    const conversation = id.value;
    if (!conversation) return;
    aroundFocus.value = null;
    await queryClient.resetQueries({ queryKey: queryKeys.conversationMessages(conversation) });
    await query.refetch();
  }

  return {
    messages,
    isLoading,
    isSending,
    previousPage,
    nextPage,
    isAtLiveEdge,
    showJumpToLatest,
    failed: computed(() => failedClientId.value != null),
    loadPrevious: () => query.fetchNextPage(),
    loadNext: () => query.fetchPreviousPage(),
    jumpAround,
    jumpToLatest,
    send,
    retrySend,
    reload: () => query.refetch(),
  };
}
