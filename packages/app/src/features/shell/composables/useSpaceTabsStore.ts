import type { ArtifactId, ArtifactKind, SpaceId } from "@denser/contracts";
import { useStorage } from "@vueuse/core";
import { moveStoredTab, storedSpaceTabKey, type StoredSpaceTab } from "../lib/space-tabs";

type TabsByHost = Record<string, StoredSpaceTab[]>;

export function useSpaceTabsStore() {
  const tabsByHost = useStorage<TabsByHost>("denser-space-tabs", {});

  function listTabs(hostSpaceId: SpaceId): StoredSpaceTab[] {
    return tabsByHost.value[hostSpaceId] ?? [];
  }

  function setTabs(hostSpaceId: SpaceId, tabs: StoredSpaceTab[]) {
    tabsByHost.value = { ...tabsByHost.value, [hostSpaceId]: tabs };
  }

  function addTab(hostSpaceId: SpaceId, tab: StoredSpaceTab) {
    const key = storedSpaceTabKey(tab);
    const current = listTabs(hostSpaceId);
    if (current.some((entry) => storedSpaceTabKey(entry) === key)) return;
    setTabs(hostSpaceId, [...current, tab]);
  }

  function removeTab(hostSpaceId: SpaceId, tabKey: string) {
    const current = listTabs(hostSpaceId);
    setTabs(
      hostSpaceId,
      current.filter((entry) => storedSpaceTabKey(entry) !== tabKey),
    );
  }

  function moveTab(hostSpaceId: SpaceId, tabKey: string, toIndex: number) {
    setTabs(hostSpaceId, moveStoredTab(listTabs(hostSpaceId), tabKey, toIndex));
  }

  function addArtifactTab(hostSpaceId: SpaceId, artifact: { id: ArtifactId; kind: ArtifactKind }) {
    if (artifact.kind !== "document" && artifact.kind !== "conversation") return;
    addTab(hostSpaceId, {
      kind: "artifact",
      artifactId: artifact.id,
      artifactKind: artifact.kind,
    });
  }

  function addChildSpaceTab(hostSpaceId: SpaceId, childSpaceId: SpaceId) {
    if (hostSpaceId === childSpaceId) return;
    addTab(hostSpaceId, { kind: "space", spaceId: childSpaceId });
  }

  function removeArtifactTabEverywhere(artifactId: ArtifactId) {
    const next: TabsByHost = {};
    for (const [hostId, tabs] of Object.entries(tabsByHost.value)) {
      const filtered = tabs.filter(
        (tab) => !(tab.kind === "artifact" && tab.artifactId === artifactId),
      );
      if (filtered.length > 0) {
        next[hostId] = filtered;
      }
    }
    tabsByHost.value = next;
  }

  function removeSpaceTabEverywhere(spaceId: SpaceId) {
    const next: TabsByHost = {};
    for (const [hostId, tabs] of Object.entries(tabsByHost.value)) {
      const filtered = tabs.filter((tab) => !(tab.kind === "space" && tab.spaceId === spaceId));
      if (filtered.length > 0) {
        next[hostId] = filtered;
      }
    }
    tabsByHost.value = next;
  }

  return {
    listTabs,
    addTab,
    removeTab,
    moveTab,
    addArtifactTab,
    addChildSpaceTab,
    removeArtifactTabEverywhere,
    removeSpaceTabEverywhere,
    storedSpaceTabKey,
  };
}
