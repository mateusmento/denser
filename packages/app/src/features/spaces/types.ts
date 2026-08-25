import type { ArtifactSummary, SpaceMember, SpaceSummary } from "@denser/contracts";

export type SpaceSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type SpaceSurfaceView = {
  state: SpaceSurfaceState;
  errorMessage?: string;
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

export type SpaceSettingsSection = "members";

export type SpaceMembersView = {
  members: readonly SpaceMember[];
  canManage: boolean;
  isNested: boolean;
  visibility: SpaceSummary["visibility"];
  isUpdatingVisibility: boolean;
  isAddingMember: boolean;
  removingMemberId: string | null;
};
