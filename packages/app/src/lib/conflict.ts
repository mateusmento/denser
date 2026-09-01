import type { DocumentView, PatchDocumentInput, TipTapDoc } from "@denser/contracts";

export type DocumentDirtyFields = {
  title: boolean;
  body: boolean;
  properties?: boolean;
};

export function buildDocumentPatch(
  draft: { title: string; body: TipTapDoc; properties?: Record<string, unknown> },
  baseVersion: number,
  dirty: DocumentDirtyFields,
): PatchDocumentInput | null {
  const patch: PatchDocumentInput = { version: baseVersion };
  let hasChange = false;

  if (dirty.title) {
    patch.title = draft.title;
    hasChange = true;
  }
  if (dirty.body) {
    patch.body = draft.body;
    hasChange = true;
  }
  if (dirty.properties && draft.properties) {
    patch.properties = draft.properties;
    hasChange = true;
  }

  return hasChange ? patch : null;
}

/** Merge client pending edits onto the server snapshot and retry. */
export function mergeDocumentConflict(
  server: DocumentView,
  pending: PatchDocumentInput,
): { next: PatchDocumentInput; sameFieldConflict: boolean } {
  let sameFieldConflict = false;

  if (pending.title !== undefined && pending.title !== server.title) {
    sameFieldConflict = true;
  }
  if (pending.body !== undefined) {
    sameFieldConflict = true;
  }
  if (pending.properties !== undefined) {
    sameFieldConflict = true;
  }

  return {
    sameFieldConflict,
    next: {
      version: server.version,
      ...(pending.title !== undefined ? { title: pending.title } : {}),
      ...(pending.body !== undefined ? { body: pending.body } : {}),
      ...(pending.properties !== undefined ? { properties: pending.properties } : {}),
    },
  };
}
