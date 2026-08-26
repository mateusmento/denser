import type { ArtifactId, SpaceId, SpaceSummary } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/lib/api";
import { isNewDocumentRoute, openNewDocumentRoute } from "@/features/document/lib/routes";
import { useLiveSpace, useLiveSpacesInWindow } from "@/features/spaces/lib/live-spaces";
import {
  artifactsCollection,
  documentsCollection,
  spacesCollection,
  upsertInCollection,
  upsertMany,
} from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import type { WorkspaceNavLink, WorkspaceNavView } from "../types";

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

function documentLink(artifactId: ArtifactId, title: string, isActive: boolean): WorkspaceNavLink {
  return {
    id: artifactId,
    label: title,
    to: { name: "document", params: { documentId: artifactId } },
    isActive,
  };
}

export function useWorkspaceNavSync() {
  const route = useRoute();
  const router = useRouter();
  const queryClient = useQueryClient();

  const activeSpaceId = computed(() => route.params.spaceId as SpaceId | undefined);
  const activeDocumentId = computed(() => {
    const documentId = route.params.documentId as string | undefined;
    return isNewDocumentRoute(documentId) ? undefined : (documentId as ArtifactId | undefined);
  });
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
    queryKey: computed(() => queryKeys.document(activeDocumentId.value ?? "")),
    enabled: computed(() => activeDocumentId.value != null),
    queryFn: async () => {
      const { document } = await apiClient.getDocument(activeDocumentId.value!);
      upsertInCollection(documentsCollection, document);
      return document;
    },
  });

  const documentSpaceId = computed(() => documentQuery.data.value?.spaceId ?? undefined);

  const documentSpaceQuery = useQuery({
    queryKey: computed(() => queryKeys.space(documentSpaceId.value ?? "")),
    enabled: computed(() => documentSpaceId.value != null && activeSpaceId.value == null),
    queryFn: async () => {
      const detail = await apiClient.getSpace(documentSpaceId.value!);
      upsertInCollection(spacesCollection, detail.space);
      upsertMany(spacesCollection, detail.childSpaces);
      upsertMany(artifactsCollection, detail.artifacts);
      return detail;
    },
  });

  const contextDetail = computed(
    () => routeSpaceQuery.data.value ?? documentSpaceQuery.data.value ?? null,
  );

  const liveRootSpaces = useLiveSpacesInWindow(
    computed(() => homeQuery.data.value?.spaces ?? []),
  );
  const liveContextChildSpaces = useLiveSpacesInWindow(
    computed(() => contextDetail.value?.childSpaces ?? []),
  );
  const contextSpaceId = computed(() => contextDetail.value?.space.id);
  const liveContextSpace = useLiveSpace(contextSpaceId);

  const view = computed((): WorkspaceNavView => {
    if (homeQuery.isLoading.value) {
      return { state: "loading", rootSpaces: [], rootDocuments: [] };
    }
    if (homeQuery.isError.value) {
      return {
        state: "error",
        errorMessage: "Couldn’t load workspace.",
        rootSpaces: [],
        rootDocuments: [],
      };
    }

    const home = homeQuery.data.value!;
    const activeSpace = activeSpaceId.value;
    const activeDoc = activeDocumentId.value;

    const rootSpaces = liveRootSpaces.value.map((space) => spaceLink(space, activeSpace === space.id));

    const rootDocuments = home.artifacts.map((artifact) =>
      documentLink(artifact.id, artifact.title, activeDoc === artifact.id),
    );

    const detail = contextDetail.value;
    const context = detail
      ? {
          title: (liveContextSpace.value ?? detail.space).title,
          spaces: liveContextChildSpaces.value.map((space) =>
            spaceLink(space, activeSpace === space.id),
          ),
          documents: detail.artifacts.map((artifact) =>
            documentLink(artifact.id, artifact.title, activeDoc === artifact.id),
          ),
        }
      : undefined;

    return {
      state: "ready",
      rootSpaces,
      rootDocuments,
      context,
    };
  });

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.home() });
    if (activeSpaceId.value) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(activeSpaceId.value) });
    }
    if (documentSpaceId.value) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(documentSpaceId.value) });
    }
  };

  const createSpaceMutation = useMutation({
    mutationFn: (title: string) => {
      const parentSpaceId = activeSpaceId.value;
      return apiClient.createSpace(
        parentSpaceId ? { title, parentSpaceId } : { title },
      );
    },
    onSuccess: async ({ space }) => {
      reload();
      await router.push({ name: "space", params: { spaceId: space.id } });
    },
  });

  const createDocument = () => openNewDocumentRoute(router);

  return {
    view,
    isHomeActive,
    reload,
    createSpace: (title: string) => createSpaceMutation.mutateAsync(title),
    createDocument,
  };
}
