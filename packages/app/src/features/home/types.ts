import type { SpaceGalleryArtifact, SpaceGallerySpace } from "@/modules/spaces";

export type HomeSurfaceState = "loading" | "ready" | "error";

export type HomeSurfaceView = {
  state: HomeSurfaceState;
  errorMessage?: string;
};

export type HomeContentView = {
  spaces: readonly SpaceGallerySpace[];
  artifacts: readonly SpaceGalleryArtifact[];
};
