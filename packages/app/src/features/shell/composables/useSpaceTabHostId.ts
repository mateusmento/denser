import type { ArtifactId, SpaceId } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { resolveSpaceTabHostId } from "../lib/space-tabs";
import { useActiveTabHost } from "./useActiveTabHost";

/** Space whose tab bar is active (This Space + working tabs). */
export function useSpaceTabHostId() {
  const route = useRoute();
  const { activeTabHostId } = useActiveTabHost();

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
    return resolveSpaceTabHostId({
      routeName: route.name,
      routeSpaceId: routeSpaceId.value,
      activeTabHostId: activeTabHostId.value,
      documentSpaceId: documentQuery.data.value?.spaceId,
      conversationSpaceId: conversationQuery.data.value?.spaceId,
      conversationKind: conversationQuery.data.value?.conversationKind,
    });
  });

  return {
    hostSpaceId,
    routeSpaceId,
    activeDocumentId,
    activeConversationId,
    documentQuery,
    conversationQuery,
  };
}
