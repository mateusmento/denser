import type {
  ArtifactId,
  ArtifactSummary,
  PropertyDefinition,
  SpaceId,
  SpaceMember,
} from "@denser/contracts";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";

export type RelationDocumentsEntry = {
  loading: boolean;
  items: ArtifactSummary[];
};

export type DocumentPropertiesView = {
  schema: PropertyDefinition[];
  values: Record<string, unknown>;
  canManage: boolean;
  editable: boolean;
  members: SpaceMember[];
  currentSpaceId?: SpaceId | null;
  currentDocumentId?: ArtifactId | null;
  relationSpaces: readonly SpaceMoveNode[];
  relationDocumentsBySpaceId: Partial<Record<SpaceId, RelationDocumentsEntry>>;
};

export function toDocumentPropertiesView(input: {
  schema: PropertyDefinition[];
  values: Record<string, unknown>;
  canManage: boolean;
  editable: boolean;
  members: SpaceMember[];
  currentSpaceId?: SpaceId | null;
  currentDocumentId?: ArtifactId | null;
  relationSpaces: readonly SpaceMoveNode[];
  relationDocumentsBySpaceId: Partial<Record<SpaceId, RelationDocumentsEntry>>;
}): DocumentPropertiesView {
  return {
    schema: input.schema,
    values: input.values,
    canManage: input.canManage,
    editable: input.editable,
    members: input.members,
    currentSpaceId: input.currentSpaceId,
    currentDocumentId: input.currentDocumentId,
    relationSpaces: input.relationSpaces,
    relationDocumentsBySpaceId: input.relationDocumentsBySpaceId,
  };
}

export function relationDocumentTitle(
  documents: readonly ArtifactSummary[],
  documentId: ArtifactId,
): string {
  return documents.find((doc) => doc.id === documentId)?.title || "Untitled";
}
