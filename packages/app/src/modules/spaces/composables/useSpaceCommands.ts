import type { SpaceId, SpaceSummary } from "@denser/contracts";
import { toast } from "@denser/design-system";
import { useActiveTabHost } from "@/features/shell/composables/useActiveTabHost";
import { useSpaceTabsStore } from "@/features/shell/composables/useSpaceTabsStore";
import { useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { removeFromCollection, spacesCollection } from "@/lib/db";
import { applySpacePatch, invalidateSpaceProjections } from "../lib/sync-space-patch";

type SpaceRef = Pick<SpaceSummary, "id" | "title" | "parentSpaceId">;

function resolveSpaceRef(
  space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
): SpaceRef {
  const cached = spacesCollection.get(space.id);
  return {
    id: space.id,
    title: space.title,
    parentSpaceId: space.parentSpaceId ?? cached?.parentSpaceId ?? null,
  };
}

export function useSpaceCommands() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const route = useRoute();
  const spaceTabs = useSpaceTabsStore();
  const { activeTabHostId, setActiveTabHost } = useActiveTabHost();

  async function renameSpace(
    space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
    title: string,
  ) {
    const target = resolveSpaceRef(space);
    const trimmed = title.trim();
    if (!trimmed || trimmed === target.title) return;
    const { space: updated } = await apiClient.patchSpace(target.id, { title: trimmed });
    applySpacePatch(updated);
    await invalidateSpaceProjections(queryClient, updated);
  }

  async function openSpace(spaceId: SpaceId) {
    const currentRouteSpace = route.params.spaceId as SpaceId | undefined;
    const host = activeTabHostId.value ?? currentRouteSpace;

    if (host && host !== spaceId) {
      setActiveTabHost(host);
      spaceTabs.addChildSpaceTab(host, spaceId);
    } else {
      setActiveTabHost(spaceId);
    }

    await router.push({ name: "space", params: { spaceId } });
  }

  async function moveSpace(
    space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
    toParentId: SpaceId | null,
  ) {
    const target = resolveSpaceRef(space);
    if (target.id === toParentId || target.parentSpaceId === toParentId) return;
    try {
      const { space: updated } = await apiClient.patchSpace(target.id, { parentSpaceId: toParentId });
      applySpacePatch(updated);
      await invalidateSpaceProjections(queryClient, target);
      await invalidateSpaceProjections(queryClient, updated);
    } catch {
      toast("Couldn’t move space");
    }
  }

  async function deleteSpace(
    space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
  ) {
    const target = resolveSpaceRef(space);

    await apiClient.deleteSpace(target.id);
    removeFromCollection(spacesCollection, target.id);
    spaceTabs.removeSpaceTabEverywhere(target.id);
    await invalidateSpaceProjections(queryClient, target);

    const activeSpaceId = route.params.spaceId as SpaceId | undefined;
    if (activeSpaceId === target.id) {
      if (target.parentSpaceId) {
        await router.push({ name: "space", params: { spaceId: target.parentSpaceId } });
      } else {
        await router.push({ name: "home" });
      }
    }
  }

  return {
    openSpace,
    renameSpace,
    deleteSpace,
    moveSpace,
  };
}
