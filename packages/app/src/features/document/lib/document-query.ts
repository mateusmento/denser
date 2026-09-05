import type { ArtifactId, DocumentTypeView, DocumentView } from "@denser/contracts";
import { omit } from "remeda";
import { apiClient } from "@/lib/api";
import { artifactsCollection, documentsCollection, upsertInCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";

export type DocumentQueryData = {
  document: DocumentView;
  documentType: DocumentTypeView | null;
};

export async function fetchDocumentQueryData(artifactId: ArtifactId): Promise<DocumentQueryData> {
  const response = await apiClient.getDocument(artifactId);
  upsertInCollection(documentsCollection, response.document);
  upsertInCollection(artifactsCollection, omit(response.document, ["body"]));
  return {
    document: response.document,
    documentType: response.documentType ?? null,
  };
}

export function documentQueryKey(artifactId: ArtifactId | undefined) {
  return queryKeys.document(artifactId ?? "");
}

/** Normalizes cache entries — shell queries used to store a bare DocumentView. */
export function readDocumentFromQueryData(
  data: DocumentQueryData | DocumentView | undefined,
): DocumentView | undefined {
  if (!data) return undefined;
  if ("document" in data) return data.document;
  if ("body" in data && "id" in data) return data;
  return undefined;
}
