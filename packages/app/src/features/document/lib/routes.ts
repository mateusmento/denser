import type { SpaceId } from "@denser/contracts";
import type { Router } from "vue-router";

export const NEW_DOCUMENT_ROUTE_ID = "new" as const;

export function isNewDocumentRoute(
  documentId: string | undefined,
): documentId is typeof NEW_DOCUMENT_ROUTE_ID {
  return documentId === NEW_DOCUMENT_ROUTE_ID;
}

export function openNewDocumentRoute(router: Router, spaceId?: SpaceId) {
  return router.push({
    name: "document",
    params: { documentId: NEW_DOCUMENT_ROUTE_ID },
    ...(spaceId ? { query: { spaceId } } : {}),
  });
}
