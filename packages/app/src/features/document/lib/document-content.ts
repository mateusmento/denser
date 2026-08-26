import type { JSONContent } from "@/modules/rich-text";
import { emptyDoc } from "@/modules/rich-text";
import type { DocumentDraftView } from "../types";

export function artifactDisplayTitle(title: string): string {
  return title.trim() || "Untitled";
}

/** @deprecated Use artifactDisplayTitle */
export const documentDisplayTitle = artifactDisplayTitle;

function isEmptyBody(body: JSONContent): boolean {
  return JSON.stringify(body) === JSON.stringify(emptyDoc());
}

export function isEmptyDocumentDraft(draft: Pick<DocumentDraftView, "title" | "body">): boolean {
  return !draft.title.trim() && isEmptyBody(draft.body);
}
