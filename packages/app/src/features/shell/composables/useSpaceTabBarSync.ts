import type { ArtifactId, SpaceId, SpaceSummary } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { artifactDisplayTitle } from "@/features/document/lib/document-content";
import { apiClient } from "@/lib/api";
import { artifactsCollection, spacesCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { useArtifactPeekHost } from "@/modules/workspace";
import { parseSpaceViewQuery } from "@/features/spaces/lib/planning";
import type { SpaceTabItem } from "../presentationals/SpaceTabBar.vue";
import { storedSpaceTabKey } from "../lib/space-tabs";
import { useActiveTabHost } from "./useActiveTabHost";
import { useSpaceTabHostId } from "./useSpaceTabHostId";
import { useSpaceTabsStore } from "./useSpaceTabsStore";

export function useSpaceTabBarSync() {
  const route = useRoute();
  const router = useRouter();
  const { openPeek } = useArtifactPeekHost();
  const spaceTabs = useSpaceTabsStore();
  const { activeTabHostId, setActiveTabHost } = useActiveTabHost();

  const {
    hostSpaceId,
    routeSpaceId,
    activeDocumentId,
    activeConversationId,
    documentQuery,
    conversationQuery,
  } = useSpaceTabHostId();

  const spaceDetailQuery = useQuery({
    queryKey: computed(() => queryKeys.space(hostSpaceId.value ?? "")),
    enabled: computed(() => hostSpaceId.value != null),
    queryFn: async () => apiClient.getSpace(hostSpaceId.value!),
  });

  const childSpaces = computed((): readonly Pick<SpaceSummary, "id" | "title">[] => {
    return spaceDetailQuery.data.value?.childSpaces ?? [];
  });

  function resolveArtifactLabel(artifactId: ArtifactId, fallback: string): string {
    const artifact = artifactsCollection.get(artifactId);
    return artifactDisplayTitle(artifact?.title ?? fallback);
  }

  function resolveSpaceLabel(spaceId: SpaceId, fallback: string): string {
    const space = spacesCollection.get(spaceId);
    return space?.title ?? fallback;
  }

  function buildTabItem(
    tabKey: string,
    label: string,
    to: SpaceTabItem["to"],
    isActive: boolean,
    closable: boolean,
  ): SpaceTabItem {
    return { tabKey, label, to, isActive, closable };
  }

  const tabs = computed((): SpaceTabItem[] => {
    const host = hostSpaceId.value;
    if (!host) return [];

    const hostSpace = spaceDetailQuery.data.value?.space;
    const activeView = parseSpaceViewQuery(route.query.view);
    const onHostSpaceRoute = route.name === "space" && routeSpaceId.value === host;

    const items: SpaceTabItem[] = [
      buildTabItem(
        `this-space:${host}`,
        "This Space",
        { name: "space", params: { spaceId: host }, query: {} },
        onHostSpaceRoute && activeView == null,
        false,
      ),
    ];

    if (hostSpace?.showBacklog) {
      items.push(
        buildTabItem(
          `view:backlog:${host}`,
          "Backlog",
          { name: "space", params: { spaceId: host }, query: { view: "backlog" } },
          onHostSpaceRoute && activeView === "backlog",
          false,
        ),
      );
    }

    if (hostSpace?.showBoard) {
      items.push(
        buildTabItem(
          `view:board:${host}`,
          "Board",
          { name: "space", params: { spaceId: host }, query: { view: "board" } },
          onHostSpaceRoute && activeView === "board",
          false,
        ),
      );
    }

    for (const stored of spaceTabs.listTabs(host)) {
      const key = storedSpaceTabKey(stored);

      if (stored.kind === "space") {
        items.push(
          buildTabItem(
            key,
            resolveSpaceLabel(stored.spaceId, "Space"),
            { name: "space", params: { spaceId: stored.spaceId }, query: {} },
            route.name === "space" && routeSpaceId.value === stored.spaceId,
            true,
          ),
        );
        continue;
      }

      if (stored.artifactKind === "document") {
        items.push(
          buildTabItem(
            key,
            resolveArtifactLabel(stored.artifactId, "Document"),
            { name: "document", params: { documentId: stored.artifactId } },
            route.name === "document" && activeDocumentId.value === stored.artifactId,
            true,
          ),
        );
        continue;
      }

      items.push(
        buildTabItem(
          key,
          resolveArtifactLabel(stored.artifactId, "Conversation"),
          { name: "conversation", params: { conversationId: stored.artifactId } },
          route.name === "conversation" && activeConversationId.value === stored.artifactId,
          true,
        ),
      );
    }

    return items;
  });

  watch(
    [
      hostSpaceId,
      () => route.name,
      activeDocumentId,
      activeConversationId,
      documentQuery.data,
      conversationQuery.data,
      routeSpaceId,
    ],
    () => {
      const host = hostSpaceId.value;
      if (!host) return;

      if (!activeTabHostId.value) {
        if (route.name === "document" && documentQuery.data.value?.spaceId) {
          setActiveTabHost(documentQuery.data.value.spaceId);
        } else if (route.name === "conversation") {
          const conversation = conversationQuery.data.value;
          if (conversation?.spaceId && conversation.conversationKind === "regular") {
            setActiveTabHost(conversation.spaceId);
          }
        }
      }

      const tabHost = hostSpaceId.value;
      if (!tabHost) return;

      if (route.name === "document" && documentQuery.data.value?.spaceId) {
        spaceTabs.addArtifactTab(tabHost, {
          id: documentQuery.data.value.id,
          kind: "document",
        });
      }

      const conversation = conversationQuery.data.value;
      if (
        route.name === "conversation" &&
        conversation &&
        conversation.conversationKind === "regular"
      ) {
        spaceTabs.addArtifactTab(tabHost, {
          id: conversation.id,
          kind: "conversation",
        });
      }
    },
    { immediate: true },
  );

  function addTab(action: "document" | "conversation") {
    const host = hostSpaceId.value;
    if (!host) return;
    setActiveTabHost(host);
    openPeek(action, host, { navigateOnCreate: true });
  }

  function openChildSpace(childSpaceId: SpaceId) {
    const host = hostSpaceId.value;
    if (!host) return;
    setActiveTabHost(host);
    spaceTabs.addChildSpaceTab(host, childSpaceId);
    void router.push({ name: "space", params: { spaceId: childSpaceId }, query: {} });
  }

  function reorderTab(tabKey: string, toIndex: number) {
    const host = hostSpaceId.value;
    if (!host) return;
    spaceTabs.moveTab(host, tabKey, toIndex);
  }

  function closeTab(tabKey: string) {
    const host = hostSpaceId.value;
    if (!host) return;

    const closing = tabs.value.find((tab) => tab.tabKey === tabKey);
    spaceTabs.removeTab(host, tabKey);

    if (closing?.isActive) {
      void router.push({ name: "space", params: { spaceId: host }, query: {} });
    }
  }

  const visible = computed(() => hostSpaceId.value != null);

  return {
    tabs,
    visible,
    hostSpaceId,
    childSpaces,
    addTab,
    openChildSpace,
    closeTab,
    reorderTab,
  };
}
