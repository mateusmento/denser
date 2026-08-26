import { apiClient } from "@/lib/api";
import { removeFromCollection, spacesCollection } from "@/lib/db";
import { confirm, prompt } from "@/lib/dialog";
import type { SpaceId, SpaceSummary } from "@denser/contracts";
import { useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
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

  async function renameSpaceWithDialog(
    space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
  ) {
    const target = resolveSpaceRef(space);
    const title = await prompt({
      title: "Rename space",
      label: "Name",
      defaultValue: target.title,
      confirmLabel: "Save",
    });
    if (!title?.trim() || title.trim() === target.title) return;
    await renameSpace(target, title.trim());
  }

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
    await router.push({ name: "space", params: { spaceId } });
  }

  async function deleteSpace(
    space: Pick<SpaceSummary, "id" | "title"> & Partial<Pick<SpaceSummary, "parentSpaceId">>,
  ) {
    const target = resolveSpaceRef(space);
    const confirmed = await confirm({
      title: `Delete “${target.title}”?`,
      description: "This space and everything inside it will be permanently deleted.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    await apiClient.deleteSpace(target.id);
    removeFromCollection(spacesCollection, target.id);
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
    renameSpaceWithDialog,
    deleteSpace,
  };
}
