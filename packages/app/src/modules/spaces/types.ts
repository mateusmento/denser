import type { ArtifactSummary, SpaceIcon, SpaceSummary } from "@denser/contracts";

export type SpaceGeneralView = {
  title: string;
  icon: SpaceIcon | null;
  canManage: boolean;
  isSaving: boolean;
};

export type SpaceGallerySpace = Pick<SpaceSummary, "id" | "title" | "icon" | "parentSpaceId">;

export type SpaceGallerySpaceAction = "open" | "rename" | "openSettings" | "delete";

export type SpaceGalleryArtifact = Pick<
  ArtifactSummary,
  "id" | "title" | "kind" | "version" | "spaceId"
>;

export type SpaceGalleryArtifactAction = "open" | "rename" | "duplicate" | "delete";
