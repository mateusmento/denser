import type { ArtifactKind, SpaceId } from "@denser/contracts";

export type WorkspaceCreateScope = {
  spaceId?: SpaceId | null;
};

export type ArtifactPeekState =
  | { open: false }
  | { open: true; kind: ArtifactKind; spaceId?: SpaceId | null };

export type WorkspaceCreateAction = "space" | "document" | "conversation";
