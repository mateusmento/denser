import type { ArtifactSummary, SpaceId, SpacePreset, SpaceSummary } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { useLiveSpacesInWindow } from "@/modules/spaces";
import { artifactsCollection, spacesCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";

export function useHomeSync() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const homeQuery = useQuery({
    queryKey: queryKeys.home(),
    queryFn: async () => {
      const home = await apiClient.home();
      upsertMany(spacesCollection, home.spaces);
      upsertMany(artifactsCollection, home.artifacts);
      return home;
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: ({ title, preset }: { title: string; preset?: SpacePreset }) =>
      apiClient.createSpace({ title, ...(preset ? { preset } : {}) }),
    onSuccess: async ({ space }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const view = computed(() => {
    if (homeQuery.isLoading.value) return { state: "loading" as const };
    if (homeQuery.isError.value) {
      return { state: "error" as const, errorMessage: "Couldn’t load home." };
    }
    return { state: "ready" as const };
  });

  const spaces = useLiveSpacesInWindow(
    computed(() => homeQuery.data.value?.spaces ?? ([] as SpaceSummary[])),
  );
  const artifacts = computed(
    () => homeQuery.data.value?.artifacts.filter((a) => a.kind !== "conversation") ?? [],
  );

  return {
    view,
    spaces,
    artifacts,
    reload: () => homeQuery.refetch(),
    createSpace: (title: string, _parentSpaceId?: SpaceId | null, preset?: SpacePreset) =>
      createSpaceMutation.mutateAsync({ title, preset }),
    openSpace: (spaceId: string) => router.push({ name: "space", params: { spaceId } }),
  };
}
