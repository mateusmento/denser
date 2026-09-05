import type { ArtifactId, SpaceId } from "@denser/contracts";
import type { WorkspaceNavLink } from "../types";

export const IN_SPACE_SIDEBAR_ITEM_LIMIT = 7;

export function truncateInSpaceNavItems(
  items: readonly WorkspaceNavLink[],
  options: {
    limit?: number;
    scopeSpaceId: SpaceId;
    scopeSpaceTitle: string;
    activeSpaceId?: SpaceId;
    activeArtifactId?: ArtifactId;
  },
): { items: WorkspaceNavLink[]; seeAllLink?: WorkspaceNavLink } {
  const limit = options.limit ?? IN_SPACE_SIDEBAR_ITEM_LIMIT;
  if (items.length <= limit) {
    return { items: [...items] };
  }

  const activeId = options.activeArtifactId ?? options.activeSpaceId;
  const activeIndex = activeId ? items.findIndex((item) => item.id === activeId) : -1;

  const visible =
    activeIndex >= limit
      ? [...items.slice(0, limit - 1), items[activeIndex]!]
      : items.slice(0, limit);

  const hiddenCount = items.length - limit;
  const seeAllLink: WorkspaceNavLink = {
    id: `see-all-${options.scopeSpaceId}`,
    label:
      hiddenCount === 1
        ? `See 1 more in ${options.scopeSpaceTitle}`
        : `See all in ${options.scopeSpaceTitle}`,
    to: { name: "space", params: { spaceId: options.scopeSpaceId } },
    isActive:
      options.activeSpaceId === options.scopeSpaceId && options.activeArtifactId == null,
  };

  return { items: visible, seeAllLink };
}
