import type { ArtifactSummary, SpaceSummary } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
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
    mutationFn: (title: string) => apiClient.createSpace({ title }),
    onSuccess: async ({ space }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: () => apiClient.createDocument({ title: "Untitled" }),
    onSuccess: async ({ document }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
      await router.push({ name: "document", params: { documentId: document.id } });
    },
  });

  const view = computed(() => {
    if (homeQuery.isLoading.value) return { state: "loading" as const };
    if (homeQuery.isError.value) {
      return { state: "error" as const, errorMessage: "Couldn’t load home." };
    }
    return { state: "ready" as const };
  });

  const spaces = computed(() => homeQuery.data.value?.spaces ?? ([] as SpaceSummary[]));
  const artifacts = computed(() => homeQuery.data.value?.artifacts ?? ([] as ArtifactSummary[]));

  return {
    view,
    spaces,
    artifacts,
    reload: () => homeQuery.refetch(),
    createSpace: (title: string) => createSpaceMutation.mutateAsync(title),
    createDocument: () => createDocumentMutation.mutateAsync(),
    openSpace: (spaceId: string) => router.push({ name: "space", params: { spaceId } }),
    openDocument: (artifactId: string) =>
      router.push({ name: "document", params: { documentId: artifactId } }),
  };
}
