import type { JSONContent, MentionCandidate } from "@/modules/rich-text";

export type DocumentSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type DocumentHeaderView = {
  title: string;
  spaceLabel?: string;
};

export type DocumentEditorView = {
  state: DocumentSurfaceState;
  canEdit: boolean;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  errorMessage?: string;
  mentionItems?: readonly MentionCandidate[];
};

export type DocumentSurfaceView = DocumentEditorView & {
  header: DocumentHeaderView;
};

export type DocumentDraftView = {
  title: string;
  body: JSONContent;
};

export function toDocumentEditorView(view: DocumentSurfaceView): DocumentEditorView {
  const { header: _header, ...editor } = view;
  return editor;
}
