import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";

export type HomeSurfaceState = "loading" | "ready" | "error";

export type HomeSurfaceView = {
  state: HomeSurfaceState;
  errorMessage?: string;
};
