import type { ArtifactId, MessageDraftDto, MessageId } from "@denser/contracts";
import { ApiMessageDraftConflictError } from "@denser/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { cloneDoc, emptyDoc, type JSONContent } from "@/modules/rich-text";
import { isEmptyComposerBody } from "../lib/composer-content";

/** Draft key thread segment: `null` = main composer; else thread root message id (ticket 07). */
export function messageDraftThreadKey(threadId: MessageId | null | undefined): string | null {
  return threadId ?? null;
}

type DraftQueryData = MessageDraftDto | null;

export function useMessageDraftSync(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  threadId: ReadonlyRefOrGetter<MessageId | null | undefined>,
  options?: { enabled?: ReadonlyRefOrGetter<boolean> },
) {
  const conversation = toReadonlyRef(conversationId);
  const thread = toReadonlyRef(threadId);
  const syncEnabled = toReadonlyRef(options?.enabled ?? (() => true));
  const queryClient = useQueryClient();

  const version = ref(0);
  const draftId = ref<string | null>(null);
  const enabled = computed(
    () => syncEnabled.value && conversation.value != null && thread.value !== undefined,
  );

  const draftQueryKey = computed(() =>
    conversation.value
      ? queryKeys.messageDraft(conversation.value, messageDraftThreadKey(thread.value))
      : (["messageDraft", "disabled"] as const),
  );

  const draftQuery = useQuery({
    queryKey: draftQueryKey,
    enabled,
    queryFn: async (): Promise<DraftQueryData> => {
      const { draft } = await apiClient.getMessageDraft(conversation.value!, {
        threadId: thread.value ?? null,
      });
      return draft;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (body: JSONContent) => {
      const { draft } = await apiClient.upsertMessageDraft(conversation.value!, {
        conversationId: conversation.value!,
        threadId: thread.value ?? null,
        body,
        version: version.value,
      });
      return draft;
    },
    onSuccess: (draft) => {
      queryClient.setQueryData(draftQueryKey.value, draft);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.deleteMessageDraft(conversation.value!, {
        threadId: thread.value ?? null,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(draftQueryKey.value, null);
    },
  });

  function applyServerDraft(draft: MessageDraftDto | null, body: Ref<JSONContent>) {
    if (draft) {
      version.value = draft.version;
      draftId.value = draft.id;
      body.value = cloneDoc(draft.body as JSONContent);
      return;
    }
    version.value = 0;
    draftId.value = null;
    body.value = emptyDoc();
  }

  function bindDraft(body: Ref<JSONContent>) {
    let syncing = false;
    const dirty = ref(false);

    function adoptConflictDraft(error: ApiMessageDraftConflictError, editor: Ref<JSONContent>) {
      syncing = true;
      applyServerDraft(error.draft, editor);
      dirty.value = false;
      syncing = false;
    }

    const schedulePersist = useDebounceFn(async (editor: Ref<JSONContent>) => {
      if (!enabled.value || !conversation.value) return;

      if (isEmptyComposerBody(editor.value)) {
        if (draftId.value) {
          try {
            await deleteMutation.mutateAsync();
          } catch (error) {
            if (error instanceof ApiMessageDraftConflictError) {
              adoptConflictDraft(error, editor);
            }
          }
        }
        version.value = 0;
        draftId.value = null;
        dirty.value = false;
        return;
      }

      try {
        const draft = await upsertMutation.mutateAsync(editor.value);
        version.value = draft.version;
        draftId.value = draft.id;
        dirty.value = false;
      } catch (error) {
        if (error instanceof ApiMessageDraftConflictError) {
          adoptConflictDraft(error, editor);
        }
      }
    }, 400);

    watch(
      draftQueryKey,
      () => {
        dirty.value = false;
      },
      { flush: "sync" },
    );

    watch(
      () => draftQuery.data.value,
      (draft) => {
        if (!enabled.value || dirty.value) return;
        syncing = true;
        applyServerDraft(draft ?? null, body);
        dirty.value = false;
        syncing = false;
      },
      { immediate: true },
    );

    watch(
      () => body.value,
      () => {
        if (syncing || !enabled.value) return;
        dirty.value = true;
        schedulePersist(body);
      },
      { deep: true },
    );
  }

  async function clearDraft(body?: Ref<JSONContent>) {
    if (!enabled.value || !conversation.value) {
      if (body) {
        body.value = emptyDoc();
      }
      return;
    }

    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      if (!(error instanceof ApiMessageDraftConflictError)) throw error;
    }

    version.value = 0;
    draftId.value = null;
    if (body) {
      body.value = emptyDoc();
    }
  }

  return {
    bindDraft,
    clearDraft,
    isHydrating: computed(() => draftQuery.isPending.value),
  };
}
