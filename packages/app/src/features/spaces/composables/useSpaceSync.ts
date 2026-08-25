import type { SpaceId, SpaceVisibility, UserId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { artifactsCollection, spacesCollection, upsertInCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import type { SpaceContentView, SpaceMembersView } from "../types";

export function useSpaceSync(spaceId: ReadonlyRefOrGetter<SpaceId | undefined>) {
  const id = toReadonlyRef(spaceId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const removingMemberId = ref<string | null>(null);

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

  const invalidateSpace = async () => {
    if (!id.value) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.space(id.value) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.home() }),
    ]);
  };

  const createDocumentMutation = useMutation({
    mutationFn: () => apiClient.createDocument({ title: "Untitled", spaceId: id.value! }),
    onSuccess: async ({ document }) => {
      await invalidateSpace();
      await router.push({ name: "document", params: { documentId: document.id } });
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (title: string) =>
      apiClient.createSpace({ title, parentSpaceId: id.value! }),
    onSuccess: async ({ space }) => {
      await invalidateSpace();
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (username: string) =>
      apiClient.addSpaceMember(id.value!, { username, role: "member" }),
    onSuccess: invalidateSpace,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: UserId) => {
      removingMemberId.value = memberUserId;
      await apiClient.removeSpaceMember(id.value!, memberUserId);
    },
    onSettled: () => {
      removingMemberId.value = null;
    },
    onSuccess: invalidateSpace,
  });

  const patchVisibilityMutation = useMutation({
    mutationFn: (visibility: SpaceVisibility) =>
      apiClient.patchSpace(id.value!, { visibility }),
    onSuccess: invalidateSpace,
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

  const content = computed((): SpaceContentView | undefined => {
    const data = spaceQuery.data.value;
    if (!data) return undefined;
    return {
      space: data.space,
      childSpaces: data.childSpaces,
      artifacts: data.artifacts,
    };
  });

  const membersView = computed((): SpaceMembersView | undefined => {
    const data = spaceQuery.data.value;
    if (!data) return undefined;
    return {
      members: data.members,
      canManage: data.canManage,
      isNested: data.space.parentSpaceId != null,
      visibility: data.space.visibility,
      isUpdatingVisibility: patchVisibilityMutation.isPending.value,
      isAddingMember: addMemberMutation.isPending.value,
      removingMemberId: removingMemberId.value,
    };
  });

  return {
    view,
    content,
    detail,
    membersView,
    reload: () => spaceQuery.refetch(),
    createSpace: (title: string) => createSpaceMutation.mutateAsync(title),
    createDocument: () => createDocumentMutation.mutateAsync(),
    addMember: (username: string) => addMemberMutation.mutateAsync(username),
    removeMember: (memberUserId: UserId) => removeMemberMutation.mutateAsync(memberUserId),
    updateVisibility: (visibility: SpaceVisibility) =>
      patchVisibilityMutation.mutateAsync(visibility),
    openSpace: (nextSpaceId: string) =>
      router.push({ name: "space", params: { spaceId: nextSpaceId } }),
    openDocument: (artifactId: string) =>
      router.push({ name: "document", params: { documentId: artifactId } }),
  };
}
