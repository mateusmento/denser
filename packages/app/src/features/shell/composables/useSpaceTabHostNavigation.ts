import type { SpaceId } from "@denser/contracts";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useActiveTabHost } from "./useActiveTabHost";
import { useSpaceTabsStore } from "./useSpaceTabsStore";

/** Keeps tab-host context aligned with navigation (sidebar vs child working tabs). */
export function useSpaceTabHostNavigation() {
  const route = useRoute();
  const { activeTabHostId, setActiveTabHost } = useActiveTabHost();
  const spaceTabs = useSpaceTabsStore();

  const routeSpaceId = computed(() => route.params.spaceId as SpaceId | undefined);

  watch(
    [() => route.name, routeSpaceId],
    ([name, spaceId]) => {
      if (name === "home") {
        setActiveTabHost(null);
        return;
      }

      if (name !== "space" || !spaceId) return;

      const host = activeTabHostId.value;
      const workingChildTab =
        host != null &&
        host !== spaceId &&
        spaceTabs.listTabs(host).some((tab) => tab.kind === "space" && tab.spaceId === spaceId);

      if (!workingChildTab) {
        setActiveTabHost(spaceId);
      }
    },
    { immediate: true },
  );
}
