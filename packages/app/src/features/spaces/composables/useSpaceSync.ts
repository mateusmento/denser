import type { SpaceId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { artifactsCollection, spacesCollection, upsertInCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";

export function useSpaceSync(spaceId: ReadonlyRefOrGetter<SpaceId | undefined>) {
  const id = toReadonlyRef(spaceId);
  const queryClient = useQueryClient();
  const router = useRouter();

  const spaceQuery = useQuery({
    queryKey: computed(() => queryKeys.space(id.value ?? "")),
    enabled: computed(() => id.value != null),
    queryFn: async () => {
      const detail = await apiClient.getSpace(id.value!);
      upsertInCollection(spacesCollection, detail.space);
      upsertMany(spacesCollection, detail.childSpaces);
      upsertMany(artifactsCollection, detail.artifacts);
      return detail;
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: () => apiClient.createDocument({ title: "Untitled", spaceId: id.value! }),
    onSuccess: async ({ document }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.space(id.value!) });
      await router.push({ name: "document", params: { documentId: document.id } });
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (title: string) =>
      apiClient.createSpace({ title, parentSpaceId: id.value! }),
    onSuccess: async ({ space }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.space(id.value!) });
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const view = computed(() => {
    if (!id.value) return { state: "error" as const, errorMessage: "Missing space id." };
    if (spaceQuery.isLoading.value) return { state: "loading" as const };
    if (spaceQuery.isError.value) {
      return { state: "error" as const, errorMessage: "Couldn’t load space." };
    }
    return { state: "ready" as const };
  });

  const detail = computed(() => spaceQuery.data.value);

  return {
    view,
    detail,
    reload: () => spaceQuery.refetch(),
    createSpace: (title: string) => createSpaceMutation.mutateAsync(title),
    createDocument: () => createDocumentMutation.mutateAsync(),
    openSpace: (nextSpaceId: string) =>
      router.push({ name: "space", params: { spaceId: nextSpaceId } }),
    openDocument: (artifactId: string) =>
      router.push({ name: "document", params: { documentId: artifactId } }),
  };
}
