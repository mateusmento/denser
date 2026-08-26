import type { SpaceGalleryArtifact, SpaceGallerySpace } from "@/features/spaces/types";

export type HomeSurfaceState = "loading" | "ready" | "error";

export type HomeSurfaceView = {
  state: HomeSurfaceState;
  errorMessage?: string;
};

export type HomeContentView = {
  spaces: readonly SpaceGallerySpace[];
  artifacts: readonly SpaceGalleryArtifact[];
};
