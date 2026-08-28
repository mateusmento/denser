import type { ArtifactId, ArtifactKind, SpaceId } from "@denser/contracts";

export type StoredSpaceTab =
  | { kind: "artifact"; artifactId: ArtifactId; artifactKind: ArtifactKind }
  | { kind: "space"; spaceId: SpaceId };

export function storedSpaceTabKey(tab: StoredSpaceTab): string {
  if (tab.kind === "artifact") return `artifact:${tab.artifactId}`;
  return `space:${tab.spaceId}`;
}
