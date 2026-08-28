import type { ArtifactId, ArtifactKind, SpaceId } from "@denser/contracts";

export type StoredSpaceTab =
  | { kind: "artifact"; artifactId: ArtifactId; artifactKind: ArtifactKind }
  | { kind: "space"; spaceId: SpaceId };

export function storedSpaceTabKey(tab: StoredSpaceTab): string {
  if (tab.kind === "artifact") return `artifact:${tab.artifactId}`;
  return `space:${tab.spaceId}`;
}

export type SpaceTabHostInput = {
  routeName: string | symbol | null | undefined;
  routeSpaceId?: SpaceId;
  activeTabHostId: SpaceId | null;
  documentSpaceId?: SpaceId | null;
  conversationSpaceId?: SpaceId | null;
  conversationKind?: string | null;
};

/** Space whose tab bar is shown. Personal home is not a space — no host. */
export function resolveSpaceTabHostId(input: SpaceTabHostInput): SpaceId | undefined {
  if (input.routeName === "home") return undefined;

  if (input.routeName === "conversation" && input.conversationKind === "direct") {
    return undefined;
  }

  if (input.activeTabHostId) return input.activeTabHostId;
  if (input.routeSpaceId) return input.routeSpaceId;
  if (input.documentSpaceId) return input.documentSpaceId;
  if (input.conversationSpaceId && input.conversationKind === "regular") {
    return input.conversationSpaceId;
  }
  return undefined;
}

