import type {
  ArtifactId,
  DocumentTypeId,
  DocumentTypeView,
  DocumentView,
  PropertyDefinition,
  PropertyOption,
  PropertyType,
  SpaceId,
} from "@denser/contracts";
import {
  buildPropertyDefinition,
  isSelectPropertyDefinition,
  sanitizePropertyDefinition,
  sanitizePropertyDefinitions,
} from "@denser/contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  documentQueryKey,
  fetchDocumentQueryData,
  type DocumentQueryData,
} from "../lib/document-query";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { resolveDocumentTypeFromCatalog } from "@/lib/resolve-document-type";
import { createPropertyOption, findOptionByName } from "../lib/property-options";

export type DocumentTypeSchemaOptions = {
  artifactId: ReadonlyRefOrGetter<ArtifactId | undefined>;
  document: ReadonlyRefOrGetter<Pick<DocumentView, "documentTypeId" | "documentTypeKey"> | null | undefined>;
  documentType: ReadonlyRefOrGetter<DocumentTypeView | null | undefined>;
  spaceId: ReadonlyRefOrGetter<SpaceId | undefined>;
  catalogTypes: ReadonlyRefOrGetter<readonly DocumentTypeView[]>;
  canManageSpace: ReadonlyRefOrGetter<boolean | undefined>;
  spacePending: ReadonlyRefOrGetter<boolean>;
  /** Home / compose with no space: owner may manage their Home Doc type. */
  allowHomeManage?: ReadonlyRefOrGetter<boolean>;
  ensureSpaceFresh: () => Promise<void>;
  saveError: Ref<string | undefined>;
};

export function useDocumentTypeSchema(options: DocumentTypeSchemaOptions) {
  const id = toReadonlyRef(options.artifactId);
  const document = toReadonlyRef(options.document);
  const documentType = toReadonlyRef(options.documentType);
  const spaceId = toReadonlyRef(options.spaceId);
  const catalogTypes = toReadonlyRef(options.catalogTypes);
  const canManageSpace = toReadonlyRef(options.canManageSpace);
  const spacePending = toReadonlyRef(options.spacePending);
  const allowHomeManage = toReadonlyRef(options.allowHomeManage ?? (() => true));
  const queryClient = useQueryClient();

  const canManage = computed(() => {
    if (!spaceId.value) return allowHomeManage.value;
    if (spacePending.value) return false;
    return canManageSpace.value ?? false;
  });

  async function resolveEditableDocumentType(): Promise<DocumentTypeView | null> {
    if (documentType.value?.id) return documentType.value;

    if (spaceId.value) {
      await options.ensureSpaceFresh();
      const fromCatalog = resolveDocumentTypeFromCatalog(document.value, catalogTypes.value);
      if (fromCatalog?.id) return fromCatalog;
    }

    if (!id.value) return null;

    const next = await fetchDocumentQueryData(id.value);
    queryClient.setQueryData(documentQueryKey(id.value), next);

    if (next.documentType?.id) return next.documentType;

    if (spaceId.value) {
      await options.ensureSpaceFresh();
    }

    return (
      resolveDocumentTypeFromCatalog(next.document, catalogTypes.value) ?? null
    );
  }

  function failResolution(): void {
    options.saveError.value = "Couldn’t resolve the document type for this page.";
  }

  const patchMutation = useMutation({
    mutationFn: async (input: {
      documentTypeId: DocumentTypeId;
      name?: string;
      properties?: PropertyDefinition[];
    }) => {
      const res = await apiClient.patchDocumentType(input.documentTypeId, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.properties !== undefined ? { properties: input.properties } : {}),
      });
      return res.documentType;
    },
    onSuccess: async (updated) => {
      if (updated && id.value) {
        queryClient.setQueryData<DocumentQueryData>(documentQueryKey(id.value), (old) =>
          old ? { ...old, documentType: updated } : old,
        );
      }
      if (spaceId.value) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.space(spaceId.value) });
      }
    },
    onError: () => {
      options.saveError.value = "Couldn’t update property schema.";
    },
  });

  async function withEditableType(
    run: (type: DocumentTypeView) => Promise<void>,
  ): Promise<void> {
    const type = await resolveEditableDocumentType();
    if (!type?.id) {
      failResolution();
      return;
    }
    await options.ensureSpaceFresh();
    await run(type);
  }

  async function patchDocumentTypeProperties(properties: PropertyDefinition[]) {
    await withEditableType(async (type) => {
      await patchMutation.mutateAsync({
        documentTypeId: type.id,
        properties: sanitizePropertyDefinitions(properties),
      });
    });
  }

  async function editDocumentTypeProperty(property: PropertyDefinition) {
    await withEditableType(async (type) => {
      const sanitized = sanitizePropertyDefinition(property);
      const updated = type.properties.map((entry) =>
        entry.id === sanitized.id ? sanitized : entry,
      );
      await patchMutation.mutateAsync({ documentTypeId: type.id, properties: updated });
    });
  }

  async function renameDocumentTypeProperty(propertyId: string, newName: string) {
    await withEditableType(async (type) => {
      const updated = type.properties.map((entry) =>
        entry.id === propertyId ? { ...entry, name: newName } : entry,
      );
      await patchMutation.mutateAsync({ documentTypeId: type.id, properties: updated });
    });
  }

  async function deleteDocumentTypeProperty(propertyId: string) {
    await withEditableType(async (type) => {
      const updated = type.properties.filter((entry) => entry.id !== propertyId);
      await patchMutation.mutateAsync({ documentTypeId: type.id, properties: updated });
    });
  }

  async function duplicateDocumentTypeProperty(propertyId: string) {
    await withEditableType(async (type) => {
      const prop = type.properties.find((entry) => entry.id === propertyId);
      if (!prop) return;
      const duplicateKey = `${prop.key}_copy_${Date.now().toString().slice(-4)}`;
      const duplicate = sanitizePropertyDefinition({
        ...prop,
        id: crypto.randomUUID() as PropertyDefinition["id"],
        key: duplicateKey,
        name: `${prop.name} (Copy)`,
        order: (prop.order ?? 0) + 1,
      });
      await patchMutation.mutateAsync({
        documentTypeId: type.id,
        properties: [...type.properties, duplicate],
      });
    });
  }

  async function addDocumentTypeProperty(prop: {
    name: string;
    type: PropertyType;
    relationSpaceId?: SpaceId | null;
    allowMultiple?: boolean;
    options?: PropertyOption[];
  }) {
    options.saveError.value = undefined;
    await withEditableType(async (type) => {
      const key = prop.name.toLowerCase().replace(/[^a-z0-9_]/g, "_") || `prop_${Date.now()}`;
      const newProp = buildPropertyDefinition({
        id: crypto.randomUUID() as PropertyDefinition["id"],
        key,
        name: prop.name,
        type: prop.type,
        order: type.properties.length,
        options: prop.options,
        relationSpaceId:
          prop.type === "relation" ? (prop.relationSpaceId ?? spaceId.value ?? null) : undefined,
        allowMultiple: prop.type === "relation" ? (prop.allowMultiple ?? true) : undefined,
        dateFormat: prop.type === "date" ? "full_date" : undefined,
        timeFormat: prop.type === "date" ? "hidden" : undefined,
        notification: prop.type === "date" ? { preset: "none" as const } : undefined,
      });
      await patchMutation.mutateAsync({
        documentTypeId: type.id,
        properties: [...type.properties, newProp],
      });
    });
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

    const existing = property.options;
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

  return {
    canManage,
    patchDocumentTypeProperties,
    editDocumentTypeProperty,
    renameDocumentTypeProperty,
    deleteDocumentTypeProperty,
    duplicateDocumentTypeProperty,
    addDocumentTypeProperty,
    addDocumentTypeOptionAndSetValue,
  };
}
