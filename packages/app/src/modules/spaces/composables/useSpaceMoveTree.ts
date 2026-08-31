import type { SpaceId, SpaceSummary } from "@denser/contracts";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { spacesCollection, upsertInCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { useLiveQuery } from "@tanstack/vue-db";
import type { SpaceMoveNode } from "../lib/space-move-menu";

export function useSpaceMoveTree() {
  const queryClient = useQueryClient();

  const homeQuery = useQuery({
    queryKey: queryKeys.home(),
    queryFn: async () => {
      const home = await apiClient.home();
      upsertMany(spacesCollection, home.spaces);
      return home;
    },
  });

  const liveSpaces = useLiveQuery((q) => q.from({ spaces: spacesCollection }));

  const spaces = computed((): SpaceMoveNode[] => {
    const rows = liveSpaces.data.value ?? homeQuery.data.value?.spaces ?? [];
    return rows.map((space: SpaceSummary) => ({
      id: space.id,
      title: space.title,
      parentId: space.parentSpaceId,
    }));
  });

  async function explore(spaceId: string) {
    await queryClient.fetchQuery({
      queryKey: queryKeys.space(spaceId),
      queryFn: async () => {
        const detail = await apiClient.getSpace(spaceId as SpaceId);
        upsertInCollection(spacesCollection, detail.space);
        upsertMany(spacesCollection, detail.childSpaces);
        return detail;
      },
    });
  }

  return { spaces, explore };
}
