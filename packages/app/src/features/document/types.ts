import type { PropertyDefinition } from "@denser/contracts";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";

export type DocumentSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type DocumentHeaderView = {
  title: string;
  spaceLabel?: string;
};

export type DocumentEditorView = {
  state: DocumentSurfaceState;
  canEdit: boolean;
  canManage?: boolean;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  errorMessage?: string;
  mentionItems?: readonly MentionCandidate[];
  propertiesSchema?: PropertyDefinition[];
};

export type DocumentSurfaceView = DocumentEditorView & {
  header: DocumentHeaderView;
};

export type DocumentDraftView = {
  title: string;
  body: JSONContent;
  properties?: Record<string, unknown>;
};

export function toDocumentEditorView(view: DocumentSurfaceView): DocumentEditorView {
  const { header: _header, ...editor } = view;
  return editor;
}

export type { DocumentPropertiesView, RelationDocumentsEntry } from "./lib/document-properties-view";
