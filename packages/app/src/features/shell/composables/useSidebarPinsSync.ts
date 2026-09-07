import type { SidebarSectionItemLimit, SpaceId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { IN_SPACE_SIDEBAR_ITEM_LIMIT } from "../lib/nav-section-items";

export function useSidebarPinsSync(rootSpaceId: ReadonlyRefOrGetter<SpaceId | null | undefined>) {
  const rootId = toReadonlyRef(rootSpaceId);
  const queryClient = useQueryClient();

  const pinsQuery = useQuery({
    queryKey: computed(() => queryKeys.sidebarPins(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: async () => {
      const { pins } = await apiClient.listSidebarPins(rootId.value!);
      return pins;
    },
  });

  const preferencesQuery = useQuery({
    queryKey: computed(() => queryKeys.sidebarSectionPreferences(rootId.value ?? "")),
    enabled: computed(() => rootId.value != null),
    queryFn: async () => {
      const { preferences } = await apiClient.listSidebarSectionPreferences(rootId.value!);
      return preferences;
    },
  });

  const pinnedSpaceIds = computed(() => new Set((pinsQuery.data.value ?? []).map((pin) => pin.spaceId)));

  const itemLimitsBySpaceId = computed(() => {
    const map = new Map<string, SidebarSectionItemLimit>();
    for (const preference of preferencesQuery.data.value ?? []) {
      map.set(preference.spaceId, preference.itemLimit);
    }
    return map;
  });

  function isPinned(spaceId: SpaceId): boolean {
    return pinnedSpaceIds.value.has(spaceId);
  }

  function itemLimitFor(spaceId: SpaceId): SidebarSectionItemLimit {
    return itemLimitsBySpaceId.value.get(spaceId) ?? IN_SPACE_SIDEBAR_ITEM_LIMIT;
  }

  const pinMutation = useMutation({
    mutationFn: (spaceId: SpaceId) => apiClient.pinSidebarSpace(rootId.value!, spaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sidebarPins(rootId.value ?? "") });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (spaceId: SpaceId) => apiClient.unpinSidebarSpace(rootId.value!, spaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sidebarPins(rootId.value ?? "") });
    },
  });

  const updateLimitMutation = useMutation({
    mutationFn: ({
      spaceId,
      itemLimit,
    }: {
      spaceId: SpaceId;
      itemLimit: SidebarSectionItemLimit;
    }) => apiClient.updateSidebarSectionPreference(rootId.value!, spaceId, { itemLimit }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sidebarSectionPreferences(rootId.value ?? ""),
      });
    },
  });

  function pinSpace(spaceId: SpaceId) {
    return pinMutation.mutateAsync(spaceId);
  }

  function unpinSpace(spaceId: SpaceId) {
    return unpinMutation.mutateAsync(spaceId);
  }

  function setItemLimit(spaceId: SpaceId, itemLimit: SidebarSectionItemLimit) {
    return updateLimitMutation.mutateAsync({ spaceId, itemLimit });
  }

  function reload() {
    void pinsQuery.refetch();
    void preferencesQuery.refetch();
  }

  return {
    pins: computed(() => pinsQuery.data.value ?? []),
    isPinned,
    itemLimitFor,
    pinSpace,
    unpinSpace,
    setItemLimit,
    reload,
  };
}
