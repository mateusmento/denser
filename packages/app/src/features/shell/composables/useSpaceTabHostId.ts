import type { ArtifactId, SpaceId } from "@denser/contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  documentQueryKey,
  fetchDocumentQueryData,
  readDocumentFromQueryData,
} from "@/features/document/lib/document-query";
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
    queryKey: computed(() => documentQueryKey(activeDocumentId.value)),
    enabled: computed(() => activeDocumentId.value != null),
    queryFn: () => fetchDocumentQueryData(activeDocumentId.value!),
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
      documentSpaceId: readDocumentFromQueryData(documentQuery.data.value)?.spaceId,
      conversationSpaceId: conversationQuery.data.value?.spaceId,
      conversationRootSpaceId: conversationQuery.data.value?.rootSpaceId,
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
