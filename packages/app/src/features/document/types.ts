import type { ArtifactId, ArtifactSummary, PropertyDefinition, SpaceId } from "@denser/contracts";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";

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
  members?: any[];
  currentSpaceId?: SpaceId | null;
  currentDocumentId?: ArtifactId | null;
  relationSpaces?: readonly SpaceMoveNode[];
  getRelationDocuments?: (spaceId: SpaceId) => Promise<ArtifactSummary[]>;
  onExploreRelationSpace?: (spaceId: string) => void | Promise<void>;
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
