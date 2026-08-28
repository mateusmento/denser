import type { SpaceId } from "@denser/contracts";
import { useStorage } from "@vueuse/core";

const activeTabHostId = useStorage<SpaceId | null>("denser-active-tab-host", null);

export function useActiveTabHost() {
  function setActiveTabHost(spaceId: SpaceId | null) {
    activeTabHostId.value = spaceId;
  }

  return {
    activeTabHostId,
    setActiveTabHost,
  };
}
