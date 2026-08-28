import type { ArtifactId, SpaceId } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useActiveTabHost } from "./useActiveTabHost";
import { useSpaceTabsStore } from "./useSpaceTabsStore";

/** Space whose tab bar is active (gallery + pinned tabs). */
export function useSpaceTabHostId() {
  const route = useRoute();
  const { activeTabHostId } = useActiveTabHost();
  const spaceTabs = useSpaceTabsStore();

  const routeSpaceId = computed(() => route.params.spaceId as SpaceId | undefined);
  const activeDocumentId = computed(() => route.params.documentId as ArtifactId | undefined);
  const activeConversationId = computed(
    () => route.params.conversationId as ArtifactId | undefined,
  );

  const documentQuery = useQuery({
    queryKey: computed(() => queryKeys.document(activeDocumentId.value ?? "")),
    enabled: computed(() => activeDocumentId.value != null),
    queryFn: async () => {
      const { document } = await apiClient.getDocument(activeDocumentId.value!);
      return document;
    },
  });

  const conversationQuery = useQuery({
    queryKey: computed(() => queryKeys.conversation(activeConversationId.value ?? "")),
    enabled: computed(() => activeConversationId.value != null),
    queryFn: async () => {
      const { conversation } = await apiClient.getConversation(activeConversationId.value!);
      return conversation;
    },
  });

  const hostSpaceId = computed((): SpaceId | undefined => {
    const conversation = conversationQuery.data.value;
    if (route.name === "conversation" && conversation?.conversationKind === "direct") {
      return undefined;
    }

    const explicitHost = activeTabHostId.value;
    if (explicitHost) {
      return explicitHost;
    }

    if (routeSpaceId.value) return routeSpaceId.value;

    if (documentQuery.data.value?.spaceId) {
      return documentQuery.data.value.spaceId;
    }

    if (conversation?.spaceId && conversation.conversationKind === "regular") {
      return conversation.spaceId;
    }

    return undefined;
  });

  function isPinnedChildSpaceRoute(spaceId: SpaceId): boolean {
    const host = activeTabHostId.value;
    if (!host || host === spaceId) return false;
    return spaceTabs.listTabs(host).some(
      (tab) => tab.kind === "space" && tab.spaceId === spaceId,
    );
  }

  return {
    hostSpaceId,
    routeSpaceId,
    activeDocumentId,
    activeConversationId,
    documentQuery,
    conversationQuery,
    isPinnedChildSpaceRoute,
  };
}
