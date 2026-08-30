import type { ArtifactId, PatchSpaceInput, SpaceIcon, SpaceId, SpacePreset, SpaceSummary, SpaceVisibility, UserId, WorkflowStageId } from "@denser/contracts";
import { ApiError } from "@denser/api-client";
import { toast } from "@denser/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { artifactsCollection, spacesCollection, upsertInCollection, upsertMany } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { useLiveSpace, useLiveSpacesInWindow } from "@/modules/spaces";
import { applySpacePatch, invalidateSpaceProjections } from "@/modules/spaces";
import type { SpaceGeneralView } from "@/modules/spaces";
import type { SpaceBackLink, SpaceContentView, SpaceMembersView } from "../types";
import { thisSpaceArtifacts, thisSpaceChildSpaces } from "../lib/planning";

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

  const liveSpace = useLiveSpace(id);
  const liveChildSpaces = useLiveSpacesInWindow(
    computed(() => spaceQuery.data.value?.childSpaces ?? []),
  );
  const parentSpaceId = computed(
    () => liveSpace.value?.parentSpaceId ?? spaceQuery.data.value?.space.parentSpaceId ?? undefined,
  );
  const liveParent = useLiveSpace(parentSpaceId);

  const invalidateSpace = async (space?: Pick<SpaceSummary, "id" | "parentSpaceId">) => {
    if (!id.value && !space) return;
    const target =
      space ?? { id: id.value!, parentSpaceId: content.value?.space.parentSpaceId ?? null };
    await invalidateSpaceProjections(queryClient, target);
  };

  const createSpaceMutation = useMutation({
    mutationFn: ({
      title,
      parentSpaceId,
      preset,
    }: {
      title: string;
      parentSpaceId: SpaceId;
      preset?: SpacePreset;
    }) => apiClient.createSpace({ title, parentSpaceId, ...(preset ? { preset } : {}) }),
    onSuccess: async ({ space }) => {
      await invalidateSpace();
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (username: string) =>
      apiClient.addSpaceMember(id.value!, { username, role: "member" }),
    onSuccess: () => invalidateSpace(),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: UserId) => {
      removingMemberId.value = memberUserId;
      await apiClient.removeSpaceMember(id.value!, memberUserId);
    },
    onSettled: () => {
      removingMemberId.value = null;
    },
    onSuccess: () => invalidateSpace(),
  });

  const patchGeneralMutation = useMutation({
    mutationFn: (input: Pick<PatchSpaceInput, "title" | "icon">) =>
      apiClient.patchSpace(id.value!, input),
    onSuccess: async ({ space }) => {
      applySpacePatch(space);
    },
  });

  const patchVisibilityMutation = useMutation({
    mutationFn: (visibility: SpaceVisibility) =>
      apiClient.patchSpace(id.value!, { visibility }),
    onSuccess: async ({ space }) => {
      applySpacePatch(space);
      await invalidateSpaceProjections(queryClient, space);
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

  const content = computed((): SpaceContentView | undefined => {
    const data = spaceQuery.data.value;
    if (!data) return undefined;
    const space = liveSpace.value ?? data.space;
    return {
      space,
      childSpaces: thisSpaceChildSpaces(liveChildSpaces.value),
      artifacts: thisSpaceArtifacts(space.id, data.artifacts),
    };
  });

  const backLink = computed((): SpaceBackLink | undefined => {
    const space = liveSpace.value ?? spaceQuery.data.value?.space;
    if (!space) return undefined;

    if (space.parentSpaceId) {
      const parent = liveParent.value;
      return {
        label: parent?.title ?? "Back",
        to: { name: "space", params: { spaceId: space.parentSpaceId } },
      };
    }

    return { label: "Home", to: { name: "home" } };
  });

  const generalView = computed((): SpaceGeneralView | undefined => {
    const data = spaceQuery.data.value;
    if (!data) return undefined;
    const space = liveSpace.value ?? data.space;
    return {
      title: space.title,
      icon: space.icon,
      canManage: data.canManage,
      isSaving: patchGeneralMutation.isPending.value,
    };
  });

  const membersView = computed((): SpaceMembersView | undefined => {
    const data = spaceQuery.data.value;
    if (!data) return undefined;
    const space = liveSpace.value ?? data.space;
    return {
      members: data.members,
      canManage: data.canManage,
      isNested: space.parentSpaceId != null,
      visibility: space.visibility,
      isUpdatingVisibility: patchVisibilityMutation.isPending.value,
      isAddingMember: addMemberMutation.isPending.value,
      removingMemberId: removingMemberId.value,
    };
  });

  const startSprintMutation = useMutation({
    mutationFn: () => apiClient.startSprint(id.value!),
    onSuccess: async ({ space }) => {
      applySpacePatch(space);
      await invalidateSpace(space);
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: () => apiClient.completeSprint(id.value!),
    onSuccess: async ({ space }) => {
      applySpacePatch(space);
      await invalidateSpace(space);
    },
  });

  function findPlanningArtifact(artifactId: ArtifactId) {
    return spaceQuery.data.value?.artifacts.find((artifact) => artifact.id === artifactId);
  }

  async function moveDocument(payload: {
    artifactId: ArtifactId;
    toSpaceId: SpaceId;
    toIndex: number;
  }) {
    const artifact = findPlanningArtifact(payload.artifactId);
    if (!artifact || artifact.kind !== "document") return;
    try {
      await apiClient.patchDocument(payload.artifactId, {
        spaceId: payload.toSpaceId,
        rank: payload.toIndex,
        version: artifact.version,
      });
      await invalidateSpace();
    } catch {
      toast("Couldn’t move document");
      await invalidateSpace();
    }
  }

  async function transitionDocument(payload: { artifactId: ArtifactId; stageId: WorkflowStageId }) {
    const artifact = findPlanningArtifact(payload.artifactId);
    if (!artifact || artifact.kind !== "document") return;
    try {
      await apiClient.patchDocument(payload.artifactId, {
        stageId: payload.stageId,
        version: artifact.version,
      });
      await invalidateSpace();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast("That stage isn’t allowed from here");
      } else {
        toast("Couldn’t update stage");
      }
      await invalidateSpace();
    }
  }

  return {
    view,
    content,
    backLink,
    detail,
    generalView,
    membersView,
    reload: () => spaceQuery.refetch(),
    createSpace: (title: string, parentSpaceId?: SpaceId | null, preset?: SpacePreset) =>
      createSpaceMutation.mutateAsync({
        title,
        parentSpaceId: parentSpaceId ?? id.value!,
        preset,
      }),
    addMember: (username: string) => addMemberMutation.mutateAsync(username),
    removeMember: (memberUserId: UserId) => removeMemberMutation.mutateAsync(memberUserId),
    updateGeneral: (input: { title: string; icon: SpaceIcon }) =>
      patchGeneralMutation.mutateAsync(input),
    updateVisibility: (visibility: SpaceVisibility) =>
      patchVisibilityMutation.mutateAsync(visibility),
    openSpace: (nextSpaceId: string) =>
      router.push({ name: "space", params: { spaceId: nextSpaceId } }),
    startSprint: () => startSprintMutation.mutateAsync(),
    completeSprint: () => completeSprintMutation.mutateAsync(),
    isStartingSprint: computed(() => startSprintMutation.isPending.value),
    isCompletingSprint: computed(() => completeSprintMutation.isPending.value),
    moveDocument,
    transitionDocument,
  };
}
