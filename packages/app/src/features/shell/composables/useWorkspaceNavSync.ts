import type {
  ArtifactId,
  ArtifactSummary,
  ConversationView,
  SpaceId,
  SpacePreset,
  SpaceSummary,
  UserId,
} from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { useLiveSpace, useLiveSpacesInWindow } from "@/modules/spaces";
import { useWorkspacePresence } from "@/modules/presence/composables/useWorkspacePresence";
import {
  artifactsCollection,
  documentsCollection,
  spacesCollection,
  upsertInCollection,
  upsertMany,
} from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import type { WorkspaceNavHomeButton, WorkspaceNavLink, WorkspaceNavView } from "../types";
import { truncateInSpaceNavItems } from "../lib/nav-section-items";
import {
  documentQueryKey,
  fetchDocumentQueryData,
  readDocumentFromQueryData,
} from "@/features/document/lib/document-query";
import { artifactDisplayTitle } from "@/features/document/lib/document-content";
import { useUnreadSummarySync } from "@/features/conversation/composables/useUnreadSummarySync";

function spaceLink(
  space: Pick<SpaceSummary, "id" | "title" | "icon">,
  isActive: boolean,
): WorkspaceNavLink {
  return {
    id: space.id,
    label: space.title,
    icon: space.icon,
    to: { name: "space", params: { spaceId: space.id } },
    isActive,
  };
}

function artifactLink(
  artifact: Pick<ArtifactSummary, "id" | "title" | "kind">,
  isActive: boolean,
  unreadCount?: number,
): WorkspaceNavLink {
  const link: WorkspaceNavLink =
    artifact.kind === "conversation"
      ? {
          id: artifact.id,
          label: artifactDisplayTitle(artifact.title),
          artifactKind: "conversation",
          to: { name: "conversation", params: { conversationId: artifact.id } },
          isActive,
        }
      : {
          id: artifact.id,
          label: artifactDisplayTitle(artifact.title),
          artifactKind: "document",
          to: { name: "document", params: { documentId: artifact.id } },
          isActive,
        };

  if (artifact.kind === "conversation" && unreadCount != null && unreadCount > 0) {
    link.unreadCount = unreadCount;
  }

  return link;
}

function sectionItems(
  spaces: readonly Pick<SpaceSummary, "id" | "title" | "icon">[],
  artifacts: readonly Pick<ArtifactSummary, "id" | "title" | "kind">[],
  activeSpaceId: SpaceId | undefined,
  activeArtifactId: ArtifactId | undefined,
  unreadCountFor?: (conversationId: string) => number,
): WorkspaceNavLink[] {
  return [
    ...spaces.map((space) => spaceLink(space, activeSpaceId === space.id)),
    ...artifacts.map((artifact) => artifactLink(artifact, activeArtifactId === artifact.id, artifact.kind === "conversation" ? unreadCountFor?.(artifact.id) : undefined)),
  ];
}

function directMessageLinks(
  conversations: readonly ConversationView[],
  activeArtifactId: ArtifactId | undefined,
  isUserOnline: (userId: UserId) => boolean,
  unreadCountFor?: (conversationId: string) => number,
): WorkspaceNavLink[] {
  return conversations.map((conversation) => {
    const link = artifactLink(
      { ...conversation, title: conversation.title },
      activeArtifactId === conversation.id,
      unreadCountFor?.(conversation.id),
    );
    const peerUserId = conversation.peerUserId ?? undefined;
    return {
      ...link,
      label: conversation.title,
      peerUserId,
      peerOnline: peerUserId ? isUserOnline(peerUserId) : undefined,
    };
  });
}

export function useWorkspaceNavSync() {
  const route = useRoute();
  const router = useRouter();
  const queryClient = useQueryClient();

  const activeSpaceId = computed(() => route.params.spaceId as SpaceId | undefined);
  const activeDocumentId = computed(() => route.params.documentId as ArtifactId | undefined);
  const activeConversationId = computed(
    () => route.params.conversationId as ArtifactId | undefined,
  );
  const activeArtifactId = computed(() => activeDocumentId.value ?? activeConversationId.value);
  const isHomeActive = computed(() => route.name === "home");

  const homeQuery = useQuery({
    queryKey: queryKeys.home(),
    queryFn: async () => {
      const home = await apiClient.home();
      upsertMany(spacesCollection, home.spaces);
      upsertMany(artifactsCollection, home.artifacts);
      return home;
    },
  });

  const routeSpaceQuery = useQuery({
    queryKey: computed(() => queryKeys.space(activeSpaceId.value ?? "")),
    enabled: computed(() => activeSpaceId.value != null),
    queryFn: async () => {
      const detail = await apiClient.getSpace(activeSpaceId.value!);
      upsertInCollection(spacesCollection, detail.space);
      upsertMany(spacesCollection, detail.childSpaces);
      upsertMany(artifactsCollection, detail.artifacts);
      return detail;
    },
  });

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
      upsertInCollection(artifactsCollection, conversation);
      return conversation;
    },
  });

  const artifactSpaceId = computed(
    () =>
      readDocumentFromQueryData(documentQuery.data.value)?.spaceId ??
      conversationQuery.data.value?.spaceId ??
      undefined,
  );

  const artifactSpaceQuery = useQuery({
    queryKey: computed(() => queryKeys.space(artifactSpaceId.value ?? "")),
    enabled: computed(() => artifactSpaceId.value != null && activeSpaceId.value == null),
    queryFn: async () => {
      const detail = await apiClient.getSpace(artifactSpaceId.value!);
      upsertInCollection(spacesCollection, detail.space);
      upsertMany(spacesCollection, detail.childSpaces);
      upsertMany(artifactsCollection, detail.artifacts);
      return detail;
    },
  });

  const workspaceRootId = computed((): SpaceId | null => {
    if (routeSpaceQuery.data.value) {
      const space = routeSpaceQuery.data.value.space;
      return space.rootSpaceId ?? space.id;
    }
    if (artifactSpaceQuery.data.value) {
      const space = artifactSpaceQuery.data.value.space;
      return space.rootSpaceId ?? space.id;
    }
    if (conversationQuery.data.value?.rootSpaceId) {
      return conversationQuery.data.value.rootSpaceId;
    }
    if (documentQuery.data.value?.document.rootSpaceId) {
      return documentQuery.data.value.document.rootSpaceId;
    }
    return null;
  });

  const workspaceRootDetailQuery = useQuery({
    queryKey: computed(() => queryKeys.space(workspaceRootId.value ?? "")),
    enabled: computed(
      () =>
        workspaceRootId.value != null &&
        routeSpaceQuery.data.value == null &&
        artifactSpaceQuery.data.value == null,
    ),
    queryFn: async () => {
      const detail = await apiClient.getSpace(workspaceRootId.value!);
      upsertInCollection(spacesCollection, detail.space);
      upsertMany(spacesCollection, detail.childSpaces);
      upsertMany(artifactsCollection, detail.artifacts);
      return detail;
    },
  });

  const contextDetail = computed(
    () =>
      routeSpaceQuery.data.value ??
      artifactSpaceQuery.data.value ??
      workspaceRootDetailQuery.data.value ??
      null,
  );

  const liveRootSpaces = useLiveSpacesInWindow(computed(() => homeQuery.data.value?.spaces ?? []));
  const liveContextChildSpaces = useLiveSpacesInWindow(
    computed(() => contextDetail.value?.childSpaces ?? []),
  );
  const contextSpaceId = computed(() => contextDetail.value?.space.id);
  const liveContextSpace = useLiveSpace(contextSpaceId);

  const liveWorkspaceRoot = useLiveSpace(computed(() => workspaceRootId.value ?? undefined));

  const inPrivateWorkspace = computed(() => {
    const rootId = workspaceRootId.value;
    const contextSpace = liveContextSpace.value ?? contextDetail.value?.space;
    const root =
      liveWorkspaceRoot.value ??
      liveRootSpaces.value.find((space) => space.id === rootId) ??
      (contextSpace != null && contextSpace.parentSpaceId == null ? contextSpace : undefined);
    return root != null && root.parentSpaceId == null && root.visibility === "private";
  });

  const homeButton = computed((): WorkspaceNavHomeButton => {
    if (!inPrivateWorkspace.value) return { label: "Home", showBackHint: false };

    const rootId = workspaceRootId.value;
    const contextSpace = liveContextSpace.value ?? contextDetail.value?.space;
    const title =
      liveWorkspaceRoot.value?.title ??
      liveRootSpaces.value.find((space) => space.id === rootId)?.title ??
      (contextSpace != null && contextSpace.parentSpaceId == null && contextSpace.id === rootId
        ? contextSpace.title
        : undefined);

    if (!title) return { label: "Home", showBackHint: false };
    return { label: title, showBackHint: !isHomeActive.value };
  });

  const directMessagesQuery = useQuery({
    queryKey: computed(() => queryKeys.directMessages(workspaceRootId.value ?? "")),
    enabled: computed(() => inPrivateWorkspace.value && workspaceRootId.value != null),
    queryFn: async () => {
      const { conversations } = await apiClient.listDirectConversations(workspaceRootId.value!);
      upsertMany(artifactsCollection, conversations);
      return conversations;
    },
  });

  const { isUserOnline } = useWorkspacePresence(workspaceRootId);
  const unreadSummary = useUnreadSummarySync(workspaceRootId);

  const view = computed((): WorkspaceNavView => {
    const emptyHomeSection = {
      label: "Home",
      items: [] as WorkspaceNavLink[],
      scopeSpaceId: null,
    };

    if (homeQuery.isLoading.value) {
      return { state: "loading", homeButton: homeButton.value, homeSection: emptyHomeSection };
    }
    if (homeQuery.isError.value) {
      return {
        state: "error",
        errorMessage: "Couldn’t load workspace.",
        homeButton: homeButton.value,
        homeSection: emptyHomeSection,
      };
    }

    const home = homeQuery.data.value!;
    const activeSpace = activeSpaceId.value;
    const activeArtifact = activeArtifactId.value;

    const homeArtifacts = home.artifacts.filter((artifact) => artifact.kind !== "conversation");
    const unreadCountFor = unreadSummary.unreadCountFor;
    const homeSection = inPrivateWorkspace.value
      ? undefined
      : {
          label: "Home",
          items: sectionItems(liveRootSpaces.value, homeArtifacts, activeSpace, activeArtifact, unreadCountFor),
          scopeSpaceId: null,
        };

    const detail = contextDetail.value;
    const inSpaceSection = detail
      ? (() => {
          const space = liveContextSpace.value ?? detail.space;
          const allItems = sectionItems(
            liveContextChildSpaces.value,
            detail.artifacts,
            activeSpace,
            activeArtifact,
            unreadCountFor,
          );
          const { items, seeAllLink } = truncateInSpaceNavItems(allItems, {
            scopeSpaceId: detail.space.id,
            scopeSpaceTitle: space.title,
            activeSpaceId: activeSpace,
            activeArtifactId: activeArtifact,
          });
          return {
            label: `In ${space.title}`,
            items,
            seeAllLink,
            scopeSpaceId: detail.space.id,
          };
        })()
      : undefined;

    const rootSpaceId = inPrivateWorkspace.value ? workspaceRootId.value : null;
    const directMessagesSection =
      rootSpaceId && directMessagesQuery.data.value
        ? {
            label: "Direct messages",
            items: directMessageLinks(
              directMessagesQuery.data.value,
              activeArtifact,
              isUserOnline,
              unreadCountFor,
            ),
            scopeSpaceId: rootSpaceId,
          }
        : rootSpaceId && directMessagesQuery.isLoading.value
          ? {
              label: "Direct messages",
              items: [] as WorkspaceNavLink[],
              scopeSpaceId: rootSpaceId,
            }
          : undefined;

    return {
      state: "ready",
      homeButton: homeButton.value,
      homeSection,
      inSpaceSection,
      directMessagesSection,
      activeRootSpaceId: rootSpaceId,
    };
  });

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.home() });
    if (activeSpaceId.value) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(activeSpaceId.value) });
    }
    if (artifactSpaceId.value) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(artifactSpaceId.value) });
    }
    if (workspaceRootId.value) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(workspaceRootId.value) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.directMessages(workspaceRootId.value),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.unreadSummary(workspaceRootId.value),
      });
    }
  };

  const createSpaceMutation = useMutation({
    mutationFn: ({
      title,
      parentSpaceId,
      preset,
    }: {
      title: string;
      parentSpaceId?: SpaceId | null;
      preset?: SpacePreset;
    }) =>
      apiClient.createSpace({
        title,
        ...(parentSpaceId ? { parentSpaceId } : {}),
        ...(preset ? { preset } : {}),
      }),
    onSuccess: async ({ space }) => {
      reload();
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const createDirectMessageMutation = useMutation({
    mutationFn: ({
      rootSpaceId,
      username,
      spaceId,
    }: {
      rootSpaceId: SpaceId;
      username: string;
      spaceId?: SpaceId;
    }) =>
      apiClient.createOrOpenDirectConversation({
        rootSpaceId,
        memberUsernames: [username],
        spaceId,
      }),
    onSuccess: async ({ conversation }) => {
      reload();
      await router.push({ name: "conversation", params: { conversationId: conversation.id } });
    },
  });

  return {
    view,
    isHomeActive,
    reload,
    createSpace: (title: string, parentSpaceId?: SpaceId | null, preset?: SpacePreset) =>
      createSpaceMutation.mutateAsync({ title, parentSpaceId, preset }),
    createDirectMessage: (rootSpaceId: SpaceId, username: string, spaceId?: SpaceId) =>
      createDirectMessageMutation.mutateAsync({ rootSpaceId, username, spaceId }),
  };
}
