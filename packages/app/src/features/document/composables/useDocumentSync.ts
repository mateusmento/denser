import type { ArtifactId, SpaceId, TipTapDoc } from "@denser/contracts";
import { ApiConflictError, ApiError } from "@denser/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { useRouter } from "vue-router";
import { omit } from "remeda";
import { apiClient } from "@/lib/api";
import {
  buildDocumentPatch,
  mergeDocumentConflict,
  type DocumentDirtyFields,
} from "@/lib/conflict";
import { artifactsCollection, documentsCollection, upsertInCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { cloneDoc, emptyDoc, type JSONContent } from "@/modules/rich-text";
import { useSpaceTabsStore } from "@/features/shell/composables/useSpaceTabsStore";
import { useActiveTabHost } from "@/features/shell/composables/useActiveTabHost";
import type { DocumentDraftView, DocumentSurfaceView } from "../types";
import { isEmptyDocumentDraft } from "../lib/document-content";
import { eq, useLiveQuery } from "@tanstack/vue-db";

export type DocumentSyncOptions = {
  peekSpaceId?: ReadonlyRefOrGetter<SpaceId | undefined | null>;
  mode?: "route" | "peek";
  onPeekCreated?: (id: ArtifactId) => void;
  navigateOnCreate?: boolean;
  onPeekComplete?: () => void;
};

export function useDocumentSync(
  artifactId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options?: DocumentSyncOptions,
) {
  const id = toReadonlyRef(artifactId);
  const peekSpaceId = toReadonlyRef(options?.peekSpaceId ?? (() => undefined));
  const mode = options?.mode ?? "route";
  const isPeek = mode === "peek";
  const isCompose = computed(() => isPeek && id.value == null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const documentQuery = useQuery({
    queryKey: computed(() => queryKeys.document(id.value ?? "")),
    enabled: computed(() => id.value != null && !isCompose.value),
    queryFn: async () => {
      const { document } = await apiClient.getDocument(id.value!);
      upsertInCollection(documentsCollection, document);
      return document;
    },
  });

  const liveDocument = useLiveQuery(
    (q) =>
      id.value && !isCompose.value
        ? q
            .from({ documents: documentsCollection })
            .where(({ documents }) => eq(documents.id, id.value!))
        : undefined,
    [id, isCompose],
  );

  const canonical = computed(() => liveDocument.data.value?.[0] ?? documentQuery.data.value);

  const saveError = ref<string | undefined>();
  const isSaving = ref(false);
  const isCreating = ref(false);

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; body: TipTapDoc; spaceId?: SpaceId }) => {
      const { document } = await apiClient.createDocument({
        title: input.title,
        body: input.body,
        ...(input.spaceId ? { spaceId: input.spaceId } : {}),
      });
      upsertInCollection(documentsCollection, document);
      upsertInCollection(artifactsCollection, omit(document, ["body"]));
      return document;
    },
    onSuccess: async (document) => {
      saveError.value = undefined;
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      if (document.spaceId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.space(document.spaceId) });
      }
      if (isPeek) {
        options?.onPeekCreated?.(document.id);
        if (options?.navigateOnCreate && document.spaceId) {
          const { activeTabHostId } = useActiveTabHost();
          const host = activeTabHostId.value ?? document.spaceId;
          useSpaceTabsStore().addArtifactTab(host, {
            id: document.id,
            kind: "document",
          });
          await router.push({ name: "document", params: { documentId: document.id } });
          options.onPeekComplete?.();
        }
        return;
      }
      await router.replace({ name: "document", params: { documentId: document.id } });
    },
    onError: () => {
      saveError.value = "Couldn’t create document.";
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (input: {
      patch: ReturnType<typeof buildDocumentPatch>;
      dirty: DocumentDirtyFields;
    }) => {
      if (!id.value || !input.patch) return null;

      let attempt = 0;
      let pending = input.patch;

      while (attempt < 3) {
        attempt += 1;
        try {
          const { document } = await apiClient.patchDocument(id.value, pending);
          upsertInCollection(documentsCollection, document);
          return document;
        } catch (error) {
          if (!(error instanceof ApiConflictError)) throw error;
          const { next, sameFieldConflict } = mergeDocumentConflict(
            error.conflict.document,
            pending,
          );
          upsertInCollection(documentsCollection, error.conflict.document);
          if (sameFieldConflict && attempt >= 2) {
            throw error;
          }
          pending = next;
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

  const view = computed((): DocumentSurfaceView => {
    if (isCompose.value) {
      return {
        state: "ready",
        canEdit: true,
        header: {
          title: "",
          spaceLabel: peekSpaceId.value ? "In space" : undefined,
        },
        titlePlaceholder: "Untitled",
        bodyPlaceholder: "Start writing…",
        errorMessage: saveError.value,
      };
    }

    if (!id.value) {
      return {
        state: "error",
        canEdit: false,
        header: { title: "" },
        titlePlaceholder: "Untitled",
        bodyPlaceholder: "Start writing…",
        errorMessage: "Missing document id.",
      };
    }
    if (documentQuery.isLoading.value) {
      return {
        state: "loading",
        canEdit: false,
        header: { title: "Loading…" },
        titlePlaceholder: "Untitled",
        bodyPlaceholder: "Start writing…",
      };
    }
    if (documentQuery.isError.value) {
      const err = documentQuery.error.value;
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return {
          state: "forbidden",
          canEdit: false,
          header: { title: "Document" },
          titlePlaceholder: "Untitled",
          bodyPlaceholder: "Start writing…",
        };
      }
      return {
        state: "error",
        canEdit: false,
        header: { title: "Document" },
        titlePlaceholder: "Untitled",
        bodyPlaceholder: "Start writing…",
        errorMessage: saveError.value ?? "Couldn’t load this document.",
      };
    }

    const doc = canonical.value;
    return {
      state: "ready",
      canEdit: true,
      header: {
        title: doc?.title ?? "",
        spaceLabel: doc?.spaceId ? "In space" : undefined,
      },
      titlePlaceholder: "Untitled",
      bodyPlaceholder: "Start writing…",
      errorMessage: saveError.value,
    };
  });

  function bindDraft(draft: Ref<DocumentDraftView>, dirty: Ref<DocumentDirtyFields>) {
    let syncing = false;

    function resetDraftToEmpty() {
      syncing = true;
      draft.value = { title: "", body: emptyDoc() };
      dirty.value = { title: false, body: false };
      syncing = false;
    }

    watch(
      () => [isCompose.value, peekSpaceId.value] as const,
      ([compose, spaceId], previous) => {
        if (!compose) return;
        const [prevCompose, prevSpaceId] = previous ?? [false, undefined];
        if (prevCompose === compose && prevSpaceId === spaceId) return;
        saveError.value = undefined;
        isCreating.value = false;
        resetDraftToEmpty();
      },
    );

    watch(
      id,
      (nextId, prevId) => {
        if (!nextId || isCompose.value || nextId === prevId) return;
        dirty.value = { title: false, body: false };
        const doc = canonical.value;
        if (!doc || doc.id !== nextId) return;
        syncing = true;
        draft.value = {
          title: doc.title,
          body: cloneDoc(doc.body as JSONContent),
        };
        dirty.value = { title: false, body: false };
        syncing = false;
      },
    );

    watch(
      canonical,
      (doc) => {
        if (!doc || isCompose.value) return;
        if (dirty.value.title || dirty.value.body) return;
        syncing = true;
        draft.value = {
          title: doc.title,
          body: cloneDoc(doc.body as JSONContent),
        };
        dirty.value = { title: false, body: false };
        syncing = false;
      },
      { immediate: true },
    );

    watch(
      () => draft.value.title,
      () => {
        if (syncing) return;
        dirty.value.title = true;
        scheduleSave(draft, dirty);
      },
    );

    watch(
      () => draft.value.body,
      () => {
        if (syncing) return;
        dirty.value.body = true;
        scheduleSave(draft, dirty);
      },
      { deep: true },
    );
  }

  const scheduleSave = useDebounceFn(
    async (draft: Ref<DocumentDraftView>, dirty: Ref<DocumentDirtyFields>) => {
      if (!dirty.value.title && !dirty.value.body) return;
      if (isEmptyDocumentDraft(draft.value)) return;

      if (isCompose.value) {
        if (isCreating.value) return;
        isCreating.value = true;
        isSaving.value = true;
        try {
          await createMutation.mutateAsync({
            title: draft.value.title,
            body: draft.value.body as TipTapDoc,
            spaceId: peekSpaceId.value ?? undefined,
          });
          dirty.value = { title: false, body: false };
        } finally {
          isCreating.value = false;
          isSaving.value = false;
        }
        return;
      }

      const doc = canonical.value;
      if (!doc) return;
      if (isEmptyDocumentDraft(draft.value) && isEmptyDocumentDraft(doc)) return;

      const patch = buildDocumentPatch(
        { title: draft.value.title, body: draft.value.body as TipTapDoc },
        doc.version,
        dirty.value,
      );
      if (!patch) return;

      isSaving.value = true;
      try {
        await patchMutation.mutateAsync({ patch, dirty: { ...dirty.value } });
        dirty.value = { title: false, body: false };
      } finally {
        isSaving.value = false;
      }
    },
    600,
  );

  return {
    surfaceView: view,
    canonical,
    bindDraft,
    reload: () => documentQuery.refetch(),
    isSaving,
  };
}

export function createDocumentDraftState() {
  return {
    draft: ref<DocumentDraftView>({ title: "", body: emptyDoc() }),
    dirty: ref<DocumentDirtyFields>({ title: false, body: false }),
  };
}
