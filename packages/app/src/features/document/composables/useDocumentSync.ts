import type {
  ArtifactId,
  ArtifactSummary,
  PropertyDefinition,
  PropertyOption,
  PropertyType,
  SpaceId,
  TipTapDoc,
} from "@denser/contracts";
import {
  buildPropertyDefinition,
  isSelectPropertyDefinition,
  sanitizePropertyDefinition,
  sanitizePropertyDefinitions,
} from "@denser/contracts";
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
import { useSpaceMoveTree } from "@/modules/spaces/composables/useSpaceMoveTree";
import type { DocumentDraftView, DocumentSurfaceView, RelationDocumentsEntry } from "../types";
import { isEmptyDocumentDraft } from "../lib/document-content";
import { createPropertyOption, findOptionByName } from "../lib/property-options";
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

  const spaceId = computed(() => canonical.value?.spaceId ?? peekSpaceId.value ?? undefined);
  const documentId = computed(() => canonical.value?.id ?? undefined);

  const { spaces: relationSpaces, explore: exploreRelationSpace } = useSpaceMoveTree();

  const spaceQuery = useQuery({
    queryKey: computed(() => queryKeys.space(spaceId.value ?? "")),
    enabled: computed(() => !!spaceId.value),
    queryFn: async () => {
      const detail = await apiClient.getSpace(spaceId.value!);
      return detail;
    },
  });

  const documentType = computed(() => {
    const currentDoc = canonical.value;
    if (!currentDoc?.documentTypeId) return spaceQuery.data.value?.documentTypes?.[0];
    return spaceQuery.data.value?.documentTypes?.find((dt) => dt.id === currentDoc.documentTypeId);
  });

  async function fetchRelationDocuments(targetSpaceId: SpaceId): Promise<ArtifactSummary[]> {
    const detail = await queryClient.fetchQuery({
      queryKey: queryKeys.space(targetSpaceId),
      queryFn: async () => apiClient.getSpace(targetSpaceId),
    });
    return detail.artifacts.filter((artifact) => artifact.kind === "document");
  }

  const relationDocumentsBySpaceId = ref<Partial<Record<SpaceId, RelationDocumentsEntry>>>({});
  const relationLoadsInFlight = new Set<SpaceId>();

  async function loadRelationDocuments(targetSpaceId: SpaceId) {
    const existing = relationDocumentsBySpaceId.value[targetSpaceId];
    if (existing?.items.length && !existing.loading) return;
    if (relationLoadsInFlight.has(targetSpaceId)) return;

    relationLoadsInFlight.add(targetSpaceId);
    relationDocumentsBySpaceId.value = {
      ...relationDocumentsBySpaceId.value,
      [targetSpaceId]: { loading: true, items: existing?.items ?? [] },
    };

    try {
      const items = await fetchRelationDocuments(targetSpaceId);
      relationDocumentsBySpaceId.value = {
        ...relationDocumentsBySpaceId.value,
        [targetSpaceId]: { loading: false, items },
      };
    } catch {
      relationDocumentsBySpaceId.value = {
        ...relationDocumentsBySpaceId.value,
        [targetSpaceId]: { loading: false, items: [] },
      };
    } finally {
      relationLoadsInFlight.delete(targetSpaceId);
    }
  }

  async function ensureDocumentTypeFresh() {
    if (!spaceId.value) return;
    await queryClient.ensureQueryData({
      queryKey: queryKeys.space(spaceId.value),
      queryFn: async () => apiClient.getSpace(spaceId.value!),
    });
  }

  const patchDocTypeMutation = useMutation({
    mutationFn: async (input: { name?: string; properties?: PropertyDefinition[] }) => {
      if (!documentType.value?.id) return;
      const res = await apiClient.patchDocumentType(documentType.value.id, input);
      return res.documentType;
    },
    onSuccess: async () => {
      if (spaceId.value) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.space(spaceId.value) });
      }
    },
  });

  async function patchDocumentTypeProperties(properties: PropertyDefinition[]) {
    await ensureDocumentTypeFresh();
    await patchDocTypeMutation.mutateAsync({
      properties: sanitizePropertyDefinitions(properties),
    });
  }

  async function editDocumentTypeProperty(property: PropertyDefinition) {
    if (!documentType.value) return;
    await ensureDocumentTypeFresh();
    const sanitized = sanitizePropertyDefinition(property);
    const current = documentType.value.properties;
    const updated = current.map((entry) => (entry.id === sanitized.id ? sanitized : entry));
    await patchDocTypeMutation.mutateAsync({ properties: updated });
  }

  async function addDocumentTypeOptionAndSetValue(
    property: PropertyDefinition,
    optionName: string,
    currentValue: unknown,
    setPropertyValue: (key: string, value: unknown) => void,
  ) {
    if (!isSelectPropertyDefinition(property)) return;
    const trimmed = optionName.trim();
    if (!trimmed) return;

    const existing = isSelectPropertyDefinition(property) ? property.options : [];
    const matched = findOptionByName(existing, trimmed);
    const option = matched ?? createPropertyOption(trimmed, existing.length);

    if (!matched) {
      await editDocumentTypeProperty(
        sanitizePropertyDefinition({
          ...property,
          options: [...existing, option],
        }),
      );
    }

    if (property.type === "multi_select") {
      const current = Array.isArray(currentValue)
        ? (currentValue as string[])
        : typeof currentValue === "string" && currentValue
          ? [currentValue]
          : [];
      if (current.includes(option.name)) return;
      setPropertyValue(property.key, [...current, option.name]);
      return;
    }

    setPropertyValue(property.key, option.name);
  }

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
        propertiesSchema: documentType.value?.properties ?? [],
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

    const currentDoc = canonical.value;
    return {
      state: "ready",
      canEdit: true,
      canManage: spaceQuery.data.value?.canManage ?? true,
      header: {
        title: currentDoc?.title ?? "",
        spaceLabel: currentDoc?.spaceId ? "In space" : undefined,
      },
      titlePlaceholder: "Untitled",
      bodyPlaceholder: "Start writing…",
      errorMessage: saveError.value,
      propertiesSchema: documentType.value?.properties ?? [],
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

    watch(id, (nextId, prevId) => {
      if (!nextId || isCompose.value || nextId === prevId) return;
      dirty.value = { title: false, body: false, properties: false };
      const doc = canonical.value;
      if (!doc || doc.id !== nextId) return;
      syncing = true;
      draft.value = {
        title: doc.title,
        body: cloneDoc(doc.body as JSONContent),
        properties: { ...(doc.properties ?? {}) },
      };
      dirty.value = { title: false, body: false, properties: false };
      syncing = false;
    });

    watch(
      canonical,
      (doc) => {
        if (!doc || isCompose.value) return;
        if (dirty.value.title || dirty.value.body || dirty.value.properties) return;
        syncing = true;
        draft.value = {
          title: doc.title,
          body: cloneDoc(doc.body as JSONContent),
          properties: { ...(doc.properties ?? {}) },
        };
        dirty.value = { title: false, body: false, properties: false };
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

    watch(
      () => draft.value.properties,
      () => {
        if (syncing) return;
        dirty.value.properties = true;
        scheduleSave(draft, dirty);
      },
      { deep: true },
    );
  }

  const scheduleSave = useDebounceFn(
    async (draft: Ref<DocumentDraftView>, dirty: Ref<DocumentDirtyFields>) => {
      if (!dirty.value.title && !dirty.value.body && !dirty.value.properties) return;
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
          dirty.value = { title: false, body: false, properties: false };
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
        {
          title: draft.value.title,
          body: draft.value.body as TipTapDoc,
          properties: draft.value.properties,
        },
        doc.version,
        dirty.value,
      );
      if (!patch) return;

      isSaving.value = true;
      try {
        await patchMutation.mutateAsync({ patch, dirty: { ...dirty.value } });
        dirty.value = { title: false, body: false, properties: false };
      } finally {
        isSaving.value = false;
      }
    },
    600,
  );

  return {
    surfaceView: view,
    canonical,
    documentType,
    spaceMembers: computed(() => spaceQuery.data.value?.members ?? []),
    bindDraft,
    reload: () => documentQuery.refetch(),
    patchDocumentTypeProperties,
    editDocumentTypeProperty,
    addDocumentTypeOptionAndSetValue,
    renameDocumentTypeProperty: async (propertyId: string, newName: string) => {
      if (!documentType.value) return;
      await ensureDocumentTypeFresh();
      const updated = documentType.value.properties.map((entry) =>
        entry.id === propertyId ? { ...entry, name: newName } : entry,
      );
      await patchDocTypeMutation.mutateAsync({ properties: updated });
    },
    deleteDocumentTypeProperty: async (propertyId: string) => {
      if (!documentType.value) return;
      await ensureDocumentTypeFresh();
      const updated = documentType.value.properties.filter((entry) => entry.id !== propertyId);
      await patchDocTypeMutation.mutateAsync({ properties: updated });
    },
    duplicateDocumentTypeProperty: async (propertyId: string) => {
      if (!documentType.value) return;
      await ensureDocumentTypeFresh();
      const prop = documentType.value.properties.find((entry) => entry.id === propertyId);
      if (!prop) return;
      const duplicateKey = `${prop.key}_copy_${Date.now().toString().slice(-4)}`;
      const duplicate = sanitizePropertyDefinition({
        ...prop,
        id: crypto.randomUUID() as PropertyDefinition["id"],
        key: duplicateKey,
        name: `${prop.name} (Copy)`,
        order: (prop.order ?? 0) + 1,
      });
      const updated = [...documentType.value.properties, duplicate];
      await patchDocTypeMutation.mutateAsync({ properties: updated });
    },
    addDocumentTypeProperty: async (prop: {
      name: string;
      type: PropertyType;
      relationSpaceId?: SpaceId | null;
      allowMultiple?: boolean;
      options?: PropertyOption[];
    }) => {
      if (!documentType.value) return;
      await ensureDocumentTypeFresh();
      const key = prop.name.toLowerCase().replace(/[^a-z0-9_]/g, "_") || `prop_${Date.now()}`;
      const newProp = buildPropertyDefinition({
        id: crypto.randomUUID() as PropertyDefinition["id"],
        key,
        name: prop.name,
        type: prop.type,
        order: documentType.value.properties.length,
        options: prop.options,
        relationSpaceId:
          prop.type === "relation" ? (prop.relationSpaceId ?? spaceId.value ?? null) : undefined,
        allowMultiple: prop.type === "relation" ? (prop.allowMultiple ?? true) : undefined,
        dateFormat: prop.type === "date" ? "locale" : undefined,
        timeFormat: prop.type === "date" ? "none" : undefined,
        notification:
          prop.type === "date" ? { enabled: false, preset: "on_date" as const } : undefined,
      });
      const updated = [...documentType.value.properties, newProp];
      await patchDocTypeMutation.mutateAsync({ properties: updated });
    },
    relationSpaces,
    exploreRelationSpace,
    relationDocumentsBySpaceId,
    loadRelationDocuments,
    currentSpaceId: spaceId,
    currentDocumentId: documentId,
    isSaving,
  };
}

export function createDocumentDraftState() {
  return {
    draft: ref<DocumentDraftView>({ title: "", body: emptyDoc(), properties: {} }),
    dirty: ref<DocumentDirtyFields>({ title: false, body: false, properties: false }),
  };
}
