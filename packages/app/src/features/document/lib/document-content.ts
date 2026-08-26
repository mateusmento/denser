import type { JSONContent } from "@/modules/rich-text";
import { emptyDoc } from "@/modules/rich-text";
import type { DocumentDraftView } from "../types";

export function documentDisplayTitle(title: string): string {
  return title.trim() || "Untitled";
}

function isEmptyBody(body: JSONContent): boolean {
  return JSON.stringify(body) === JSON.stringify(emptyDoc());
}

export function isEmptyDocumentDraft(draft: Pick<DocumentDraftView, "title" | "body">): boolean {
  return !draft.title.trim() && isEmptyBody(draft.body);
}
