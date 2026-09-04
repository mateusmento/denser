import type { ArtifactSummary, DocumentTypeKey, DocumentTypeView } from "@denser/contracts";

type DocumentTypeLookup = Pick<ArtifactSummary, "documentTypeId" | "documentTypeKey">;

export function resolveDocumentTypeFromCatalog(
  document: DocumentTypeLookup | null | undefined,
  types: readonly DocumentTypeView[],
): DocumentTypeView | undefined {
  if (!types.length) return undefined;
  if (!document) return types[0];

  if (document.documentTypeId) {
    const byId = types.find((type) => type.id === document.documentTypeId);
    if (byId) return byId;
  }

  if (document.documentTypeKey) {
    const byKey = types.find((type) => type.key === document.documentTypeKey);
    if (byKey) return byKey;
  }

  if (!document.documentTypeId && !document.documentTypeKey) {
    return types[0];
  }

  return undefined;
}

export function defaultDocumentTypeForKey(
  types: readonly DocumentTypeView[],
  key: DocumentTypeKey,
): DocumentTypeView | undefined {
  return types.find((type) => type.key === key);
}
