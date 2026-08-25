import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";

export type SpaceSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type SpaceSurfaceView = {
  state: SpaceSurfaceState;
  errorMessage?: string;
};

export type SpaceDetailView = {
  space: SpaceSummary;
  childSpaces: readonly SpaceSummary[];
  artifacts: readonly ArtifactSummary[];
};
