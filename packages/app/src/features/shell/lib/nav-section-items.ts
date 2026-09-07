import type { ArtifactId, SpaceId } from "@denser/contracts";
import type { WorkspaceNavLink } from "../types";

export const IN_SPACE_SIDEBAR_ITEM_LIMIT = 7;

export function truncateInSpaceNavItems(
  items: readonly WorkspaceNavLink[],
  options: {
    limit?: number;
    activeSpaceId?: SpaceId;
    activeArtifactId?: ArtifactId;
  },
): { visible: WorkspaceNavLink[]; overflow: WorkspaceNavLink[] } {
  const limit = options.limit ?? IN_SPACE_SIDEBAR_ITEM_LIMIT;
  if (items.length <= limit) {
    return { visible: [...items], overflow: [] };
  }

  const activeId = options.activeArtifactId ?? options.activeSpaceId;
  const activeIndex = activeId ? items.findIndex((item) => item.id === activeId) : -1;

  const visible =
    activeIndex >= limit
      ? [...items.slice(0, limit - 1), items[activeIndex]!]
      : items.slice(0, limit);

  const visibleIds = new Set(visible.map((item) => item.id));
  const overflow = items.filter((item) => !visibleIds.has(item.id));

  return { visible, overflow };
}

export function overflowNavLabel(hiddenCount: number, spaceTitle: string): string {
  return hiddenCount === 1
    ? `See 1 more in ${spaceTitle}`
    : `See all in ${spaceTitle}`;
}
