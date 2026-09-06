import type { ArtifactId, MessageDraftDto, MessageId } from "@denser/contracts";
import { ApiError, ApiMessageDraftConflictError } from "@denser/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { emptyDoc, type JSONContent } from "@/modules/rich-text/types";
import { isEmptyComposerBody } from "../lib/composer-content";

import { adoptDraftBody, reconcileDraftConflict } from "../lib/draft-conflict";

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

  function syncServerDraftMetadata(draft: MessageDraftDto | null) {
    if (draft) {
      version.value = draft.version;
      draftId.value = draft.id;
      queryClient.setQueryData(draftQueryKey.value, draft);
      return;
    }
    version.value = 0;
    draftId.value = null;
    queryClient.setQueryData(draftQueryKey.value, null);
  }

  function applyServerDraft(draft: MessageDraftDto | null, body: Ref<JSONContent>) {
    if (draft) {
      version.value = draft.version;
      draftId.value = draft.id;
      body.value = adoptDraftBody(draft.body);
      return;
    }
    version.value = 0;
    draftId.value = null;
    body.value = emptyDoc();
  }

  let cancelPendingPersist: (() => void) | undefined;
  let draftPersistSuspended = false;

  function isDraftDeleteNotFound(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
  }

  function bindDraft(body: Ref<JSONContent>) {
    let syncing = false;
    const dirty = ref(false);

    function adoptConflictDraft(error: ApiMessageDraftConflictError, editor: Ref<JSONContent>) {
      syncing = true;
      const next = reconcileDraftConflict(error.draft, { dirty: dirty.value });
      version.value = next.version;
      draftId.value = next.draftId;
      if (next.replaceBody) {
        editor.value = next.replaceBody;
        dirty.value = false;
      }
      syncing = false;
    }

    const schedulePersist = useDebounceFn(async (editor: Ref<JSONContent>) => {
      if (!enabled.value || !conversation.value || draftPersistSuspended) return;

      if (isEmptyComposerBody(editor.value)) {
        if (draftId.value) {
          try {
            await deleteMutation.mutateAsync();
          } catch (error) {
            if (error instanceof ApiMessageDraftConflictError) {
              adoptConflictDraft(error, editor);
            } else if (!isDraftDeleteNotFound(error)) {
              throw error;
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

    cancelPendingPersist = () => schedulePersist.cancel();

    watch(
      draftQueryKey,
      () => {
        dirty.value = false;
        if (!enabled.value) return;
        syncing = true;
        version.value = 0;
        draftId.value = null;
        body.value = emptyDoc();
        syncing = false;
      },
      { flush: "sync" },
    );

    watch(
      () => draftQuery.data.value,
      (draft) => {
        if (!enabled.value || dirty.value || draft === undefined) return;
        syncing = true;
        applyServerDraft(draft, body);
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

  function cancelPendingDraftPersist() {
    cancelPendingPersist?.();
  }

  async function clearDraft(body?: Ref<JSONContent>) {
    cancelPendingDraftPersist();
    draftPersistSuspended = true;
    if (!enabled.value || !conversation.value) {
      if (body) {
        body.value = emptyDoc();
      }
      draftPersistSuspended = false;
      return;
    }

    try {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        if (error instanceof ApiMessageDraftConflictError) {
          // Already cleared elsewhere; keep local state reset below.
        } else if (!isDraftDeleteNotFound(error)) {
          throw error;
        }
      }

      version.value = 0;
      draftId.value = null;
      queryClient.setQueryData(draftQueryKey.value, null);
      if (body) {
        body.value = emptyDoc();
      }
    } finally {
      draftPersistSuspended = false;
    }
  }

  return {
    bindDraft,
    clearDraft,
    cancelPendingDraftPersist,
    syncServerDraftMetadata,
    isHydrating: computed(() => draftQuery.isPending.value),
  };
}
