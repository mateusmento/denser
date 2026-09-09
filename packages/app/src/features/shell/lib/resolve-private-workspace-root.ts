import type { SpaceId, SpaceSummary } from "@denser/contracts";

export function privateWorkspaceRootsFromHome(
  spaces: readonly Pick<SpaceSummary, "id" | "parentSpaceId" | "visibility">[],
): readonly SpaceId[] {
  return spaces
    .filter((space) => space.parentSpaceId == null && space.visibility === "private")
    .map((space) => space.id);
}

export function resolvePrivateWorkspaceRootId(
  spaces: readonly Pick<SpaceSummary, "id" | "parentSpaceId" | "visibility">[],
  preferredRootSpaceId?: SpaceId | null,
): SpaceId | null {
  const roots = privateWorkspaceRootsFromHome(spaces);
  if (roots.length === 0) return null;
  if (preferredRootSpaceId && roots.includes(preferredRootSpaceId)) {
    return preferredRootSpaceId;
  }
  return roots.length === 1 ? roots[0] : null;
}
