import type { ArtifactId, SpaceId } from "@denser/contracts";
import { ApiConflictError, ApiConversationConflictError, ApiError } from "@denser/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { artifactsCollection, upsertInCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { eq, useLiveQuery } from "@tanstack/vue-db";
import { artifactDisplayTitle } from "@/features/document/lib/document-content";
import { useSpaceTabsStore } from "@/features/shell/composables/useSpaceTabsStore";
import { useActiveTabHost } from "@/features/shell/composables/useActiveTabHost";
import type { JSONContent } from "@/modules/rich-text";
import type { ConversationChannelHeaderView } from "../types";

export type ConversationSyncOptions = {
  peekSpaceId?: ReadonlyRefOrGetter<SpaceId | undefined | null>;
  mode?: "route" | "peek";
  onPeekCreated?: (id: ArtifactId) => void;
  navigateOnCreate?: boolean;
  onPeekComplete?: () => void;
};

export function useConversationSync(
  artifactId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options?: ConversationSyncOptions,
) {
  const id = toReadonlyRef(artifactId);
  const peekSpaceId = toReadonlyRef(options?.peekSpaceId ?? (() => undefined));
  const mode = options?.mode ?? "route";
  const isPeek = mode === "peek";
  const isCompose = computed(() => isPeek && id.value == null);

  const queryClient = useQueryClient();
  const router = useRouter();

  const conversationQuery = useQuery({
    queryKey: computed(() => queryKeys.conversation(id.value ?? "")),
    enabled: computed(() => id.value != null),
    queryFn: async () => {
      const { conversation } = await apiClient.getConversation(id.value!);
      upsertInCollection(artifactsCollection, conversation);
      return conversation;
    },
  });

  const liveConversation = useLiveQuery(
    (q) =>
      id.value
        ? q
            .from({ artifacts: artifactsCollection })
            .where(({ artifacts }) => eq(artifacts.id, id.value!))
        : undefined,
    [id],
  );

  const canonical = computed(
    () => liveConversation.data.value?.[0] ?? conversationQuery.data.value ?? null,
  );

  const saveError = ref<string | undefined>();
  const isCreating = ref(false);
  const composeTitle = ref("");

  const createMutation = useMutation({
    mutationFn: async (input: {
      title?: string;
      initialMessage?: JSONContent;
      spaceId?: SpaceId;
    }) => {
      const { conversation } = await apiClient.createConversation({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.initialMessage ? { initialMessage: input.initialMessage as never } : {}),
        ...(input.spaceId ? { spaceId: input.spaceId } : {}),
      });
      upsertInCollection(artifactsCollection, conversation);
      return conversation;
    },
    onSuccess: async (conversation) => {
      saveError.value = undefined;
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      if (conversation.spaceId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.space(conversation.spaceId) });
      }
      if (isPeek) {
        options?.onPeekCreated?.(conversation.id);
        if (options?.navigateOnCreate && conversation.spaceId) {
          const { activeTabHostId } = useActiveTabHost();
          const host = activeTabHostId.value ?? conversation.spaceId;
          useSpaceTabsStore().addArtifactTab(host, {
            id: conversation.id,
            kind: "conversation",
          });
          await router.push({
            name: "conversation",
            params: { conversationId: conversation.id },
          });
          options.onPeekComplete?.();
        }
        return;
      }
      await router.replace({
        name: "conversation",
        params: { conversationId: conversation.id },
      });
    },
    onError: () => {
      saveError.value = "Couldn’t create conversation.";
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (input: { title: string; version: number }) => {
      let attempt = 0;
      let version = input.version;

      while (attempt < 3) {
        attempt += 1;
        try {
          const { conversation } = await apiClient.patchConversation(id.value!, {
            title: input.title,
            version,
          });
          upsertInCollection(artifactsCollection, conversation);
          return conversation;
        } catch (error) {
          if (error instanceof ApiConversationConflictError) {
            upsertInCollection(artifactsCollection, error.conflict.conversation);
            version = error.conflict.conversation.version;
            if (attempt >= 2) throw error;
            continue;
          }
          throw error;
        }
      }

      return null;
    },
    onSuccess: async () => {
      saveError.value = undefined;
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
    },
    onError: () => {
      saveError.value = "Couldn’t save changes.";
    },
  });

  const headerView = computed((): ConversationChannelHeaderView => {
    if (isCompose.value) {
      return {
        title: artifactDisplayTitle(composeTitle.value),
        members: [],
      };
    }

    if (!id.value) {
      return { title: "Conversation", members: [] };
    }

    if (conversationQuery.isLoading.value) {
      return { title: "Loading…", members: [] };
    }

    if (conversationQuery.isError.value) {
      const err = conversationQuery.error.value;
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return { title: "Conversation", members: [] };
      }
      return { title: "Conversation", members: [] };
    }

    const conversation = canonical.value;
    return {
      title: artifactDisplayTitle(conversation?.title ?? ""),
      members: [],
    };
  });

  async function ensureCreated(input?: { title?: string; initialMessage?: JSONContent }) {
    if (!isCompose.value || isCreating.value || id.value != null) return;
    isCreating.value = true;
    try {
      await createMutation.mutateAsync({
        title: input?.title ?? composeTitle.value,
        initialMessage: input?.initialMessage,
        spaceId: peekSpaceId.value ?? undefined,
      });
    } finally {
      isCreating.value = false;
    }
  }

  const scheduleTitleSave = useDebounceFn(async (title: string) => {
    if (isCompose.value) {
      if (!title.trim()) return;
      await ensureCreated({ title });
      return;
    }

    const conversation = canonical.value;
    if (!conversation || title.trim() === conversation.title) return;

    await patchMutation.mutateAsync({ title: title.trim(), version: conversation.version });
  }, 600);

  function bindComposeTitle(titleRef: Ref<string>) {
    watch(
      titleRef,
      (title) => {
        composeTitle.value = title;
        if (isCompose.value && title.trim()) {
          void scheduleTitleSave(title);
        }
      },
      { immediate: true },
    );

    watch(
      canonical,
      (conversation) => {
        if (!conversation || isCompose.value) return;
        if (titleRef.value === conversation.title) return;
        titleRef.value = conversation.title;
      },
      { immediate: true },
    );
  }

  async function sendInitialMessage(body: JSONContent) {
    if (isCompose.value) {
      await ensureCreated({
        title: composeTitle.value,
        initialMessage: body as never,
      });
    }
  }

  return {
    headerView,
    isCompose,
    saveError,
    isCreating,
    bindComposeTitle,
    sendInitialMessage,
    reload: () => conversationQuery.refetch(),
  };
}
