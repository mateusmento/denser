import type { MessageDraftDto } from "@denser/contracts";
import { cloneDoc, emptyDoc, type JSONContent } from "@/modules/rich-text/types";

function isComposerDoc(body: unknown): body is JSONContent {
  return typeof body === "object" && body !== null && (body as JSONContent).type === "doc";
}

export function adoptDraftBody(body: unknown): JSONContent {
  return isComposerDoc(body) ? cloneDoc(body) : emptyDoc();
}

/** On version conflict, keep local editor content when the user has unsaved edits. */
export function reconcileDraftConflict(
  draft: MessageDraftDto | null,
  options: { dirty: boolean },
): { version: number; draftId: string | null; replaceBody: JSONContent | null } {
  if (draft) {
    return {
      version: draft.version,
      draftId: draft.id,
      replaceBody: options.dirty ? null : adoptDraftBody(draft.body),
    };
  }
  return {
    version: 0,
    draftId: null,
    replaceBody: options.dirty ? null : emptyDoc(),
  };
}
