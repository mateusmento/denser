import type { ArtifactId, TipTapDoc } from "@denser/contracts";
import { ApiConflictError, ApiError } from "@denser/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useDebounceFn } from "@vueuse/core";
import { computed, ref, watch, type Ref } from "vue";
import { apiClient } from "@/lib/api";
import {
  buildDocumentPatch,
  mergeDocumentConflict,
  type DocumentDirtyFields,
} from "@/lib/conflict";
import { documentsCollection, upsertInCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { cloneDoc, emptyDoc, type JSONContent } from "@/modules/rich-text";
import type { DocumentDraftView, DocumentSurfaceView } from "../types";
import { eq, useLiveQuery } from "@tanstack/vue-db";

export function useDocumentSync(artifactId: ReadonlyRefOrGetter<ArtifactId | undefined>) {
  const id = toReadonlyRef(artifactId);
  const queryClient = useQueryClient();

  const documentQuery = useQuery({
    queryKey: computed(() => queryKeys.document(id.value ?? "")),
    enabled: computed(() => id.value != null),
    queryFn: async () => {
      const { document } = await apiClient.getDocument(id.value!);
      upsertInCollection(documentsCollection, document);
      return document;
    },
  });

  const liveDocument = useLiveQuery(
    (q) =>
      id.value
        ? q
            .from({ documents: documentsCollection })
            .where(({ documents }) => eq(documents.id, id.value!))
        : undefined,
    [id],
  );

  const canonical = computed(() => liveDocument.data.value?.[0] ?? documentQuery.data.value);

  const saveError = ref<string | undefined>();
  const isSaving = ref(false);

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
    if (!id.value) {
      return {
        state: "error",
        canEdit: false,
        header: { title: "Untitled" },
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
        title: doc?.title ?? "Untitled",
        spaceLabel: doc?.spaceId ? "In space" : undefined,
      },
      titlePlaceholder: "Untitled",
      bodyPlaceholder: "Start writing…",
      errorMessage: saveError.value,
    };
  });

  function bindDraft(draft: Ref<DocumentDraftView>, dirty: Ref<DocumentDirtyFields>) {
    watch(
      canonical,
      (doc) => {
        if (!doc) return;
        if (dirty.value.title || dirty.value.body) return;
        draft.value = {
          title: doc.title,
          body: cloneDoc(doc.body as JSONContent),
        };
        dirty.value = { title: false, body: false };
      },
      { immediate: true },
    );

    watch(
      () => draft.value.title,
      () => {
        dirty.value.title = true;
        scheduleSave(draft, dirty);
      },
    );

    watch(
      () => draft.value.body,
      () => {
        dirty.value.body = true;
        scheduleSave(draft, dirty);
      },
      { deep: true },
    );
  }

  const scheduleSave = useDebounceFn(
    async (draft: Ref<DocumentDraftView>, dirty: Ref<DocumentDirtyFields>) => {
      const doc = canonical.value;
      if (!doc || (!dirty.value.title && !dirty.value.body)) return;

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
