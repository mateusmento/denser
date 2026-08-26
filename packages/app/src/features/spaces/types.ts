import type { ArtifactSummary, SpaceIcon, SpaceMember, SpaceSummary } from "@denser/contracts";

export type SpaceSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type SpaceSurfaceView = {
  state: SpaceSurfaceState;
  errorMessage?: string;
};

export type SpaceBackLink = {
  label: string;
  to: {
    name: "home" | "space";
    params?: { spaceId: string };
  };
};

/** Presentational slice — listing regions the surface renders. */
export type SpaceContentView = {
  space: SpaceSummary;
  childSpaces: readonly SpaceSummary[];
  artifacts: readonly ArtifactSummary[];
};

/** Sync projection — content plus membership fields for container wiring. */
export type SpaceDetailView = SpaceContentView & {
  members: readonly SpaceMember[];
  canManage: boolean;
};

export type SpaceSettingsSection = "general" | "members";

export type SpaceGeneralView = {
  title: string;
  icon: SpaceIcon | null;
  canManage: boolean;
  isSaving: boolean;
};

export type SpaceMembersView = {
  members: readonly SpaceMember[];
  canManage: boolean;
  isNested: boolean;
  visibility: SpaceSummary["visibility"];
  isUpdatingVisibility: boolean;
  isAddingMember: boolean;
  removingMemberId: string | null;
};

export type SpaceGallerySpace = Pick<SpaceSummary, "id" | "title" | "icon" | "parentSpaceId">;

export type SpaceGallerySpaceAction = "open" | "rename" | "delete";

export type SpaceGalleryArtifact = Pick<ArtifactSummary, "id" | "title" | "kind" | "version" | "spaceId">;

export type SpaceGalleryArtifactAction = "open" | "rename" | "duplicate" | "delete";
