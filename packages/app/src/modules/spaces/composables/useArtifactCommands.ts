import { apiClient } from "@/lib/api";
import { applyArtifactPatch, artifactPatchConflictVersion } from "@/lib/artifact-patch-conflict";
import {
  artifactsCollection,
  documentsCollection,
  removeFromCollection,
  upsertInCollection,
} from "@/lib/db";
import { patchWithVersionRetry } from "@/lib/patch-with-version-retry";
import { queryKeys } from "@/lib/query-keys";
import type { ArtifactId, ArtifactKind, ArtifactSummary, SpaceId } from "@denser/contracts";
import { toast } from "@denser/design-system";
import { useActiveTabHost } from "@/features/shell/composables/useActiveTabHost";
import { useSpaceTabsStore } from "@/features/shell/composables/useSpaceTabsStore";
import type { QueryClient } from "@tanstack/vue-query";
import { useQueryClient } from "@tanstack/vue-query";
import { omit } from "remeda";
import { useRoute, useRouter } from "vue-router";

type ArtifactRef = Pick<ArtifactSummary, "id" | "title" | "version" | "spaceId" | "kind">;

function resolveArtifactRef(
  artifact: Pick<ArtifactSummary, "id" | "title"> &
    Partial<Pick<ArtifactSummary, "version" | "spaceId" | "kind">>,
): ArtifactRef {
  const cached = artifactsCollection.get(artifact.id);
  const document = documentsCollection.get(artifact.id);
  return {
    id: artifact.id,
    title: artifact.title,
    kind: artifact.kind ?? cached?.kind ?? document?.kind ?? "document",
    version: artifact.version ?? document?.version ?? cached?.version ?? 0,
    spaceId: artifact.spaceId ?? document?.spaceId ?? cached?.spaceId ?? null,
  };
}

async function resolveArtifactVersion(artifactId: ArtifactId, kind: ArtifactKind): Promise<number> {
  const cached = artifactsCollection.get(artifactId);
  if (cached?.version) return cached.version;

  if (kind === "document") {
    const document = documentsCollection.get(artifactId);
    if (document?.version) return document.version;

    const { document: loaded } = await apiClient.getDocument(artifactId);
    upsertInCollection(artifactsCollection, loaded);
    upsertInCollection(documentsCollection, loaded);
    return loaded.version;
  }

  const { conversation: loaded } = await apiClient.getConversation(artifactId);
  upsertInCollection(artifactsCollection, loaded);
  return loaded.version;
}

export async function invalidateArtifactProjections(
  queryClient: QueryClient,
  artifact: Pick<ArtifactSummary, "id" | "spaceId" | "kind">,
) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
  if (artifact.kind === "document") {
    await queryClient.invalidateQueries({ queryKey: queryKeys.document(artifact.id) });
  } else {
    await queryClient.invalidateQueries({ queryKey: queryKeys.conversation(artifact.id) });
  }
  if (artifact.spaceId) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.space(artifact.spaceId) });
  }
}

export function useArtifactCommands() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const route = useRoute();
  const spaceTabs = useSpaceTabsStore();
  const { activeTabHostId, setActiveTabHost } = useActiveTabHost();

  async function renameArtifact(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "version" | "spaceId" | "kind">>,
    title: string,
  ) {
    const target = resolveArtifactRef(artifact);
    const trimmed = title.trim();
    if (!trimmed || trimmed === target.title) return;

    const version =
      target.version > 0 ? target.version : await resolveArtifactVersion(target.id, target.kind);

    const updated = await patchWithVersionRetry({
      version,
      patch: async (nextVersion) => {
        if (target.kind === "conversation") {
          const { conversation } = await apiClient.patchConversation(target.id, {
            title: trimmed,
            version: nextVersion,
          });
          applyArtifactPatch(conversation);
          return conversation;
        }

        const { document } = await apiClient.patchDocument(target.id, {
          title: trimmed,
          version: nextVersion,
        });
        applyArtifactPatch(document);
        return document;
      },
      onConflict: artifactPatchConflictVersion,
      onFailure: () => toast("Couldn’t rename"),
    });

    if (updated) {
      await invalidateArtifactProjections(queryClient, updated);
    }
  }

  async function openArtifact(artifact: Pick<ArtifactSummary, "id" | "kind">) {
    const cached = artifactsCollection.get(artifact.id);
    const spaceId = cached?.spaceId ?? null;
    const host = activeTabHostId.value ?? spaceId;

    if (host && artifact.kind === "document") {
      setActiveTabHost(host);
      spaceTabs.addArtifactTab(host, { id: artifact.id, kind: artifact.kind });
    } else if (host && artifact.kind === "conversation") {
      const { conversation } = await apiClient.getConversation(artifact.id);
      if (conversation.conversationKind === "regular") {
        setActiveTabHost(host);
        spaceTabs.addArtifactTab(host, { id: artifact.id, kind: "conversation" });
      }
    }

    if (artifact.kind === "conversation") {
      await router.push({ name: "conversation", params: { conversationId: artifact.id } });
      return;
    }
    await router.push({ name: "document", params: { documentId: artifact.id } });
  }

  async function openDocument(artifactId: ArtifactId) {
    await openArtifact({ id: artifactId, kind: "document" });
  }

  async function duplicateArtifact(artifact: Pick<ArtifactSummary, "id" | "kind">) {
    if (artifact.kind === "conversation") return;

    const { document } = await apiClient.duplicateDocument(artifact.id);
    upsertInCollection(documentsCollection, document);
    upsertInCollection(artifactsCollection, omit(document, ["body"]));
    await invalidateArtifactProjections(queryClient, document);
    await router.push({ name: "document", params: { documentId: document.id } });
  }

  async function moveArtifact(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "version" | "spaceId" | "kind">>,
    toSpaceId: SpaceId | null,
  ) {
    const target = resolveArtifactRef(artifact);
    if (target.spaceId === toSpaceId) return;
    if (target.kind !== "document" && target.kind !== "conversation") return;

    const version =
      target.version > 0 ? target.version : await resolveArtifactVersion(target.id, target.kind);
    const failureMessage =
      target.kind === "conversation" ? "Couldn’t move conversation" : "Couldn’t move document";

    const updated = await patchWithVersionRetry({
      version,
      patch: async (nextVersion) => {
        if (target.kind === "conversation") {
          const { conversation } = await apiClient.patchConversation(target.id, {
            spaceId: toSpaceId,
            version: nextVersion,
          });
          applyArtifactPatch(conversation);
          return conversation;
        }

        const { document } = await apiClient.patchDocument(target.id, {
          spaceId: toSpaceId,
          version: nextVersion,
        });
        applyArtifactPatch(document);
        return document;
      },
      onConflict: artifactPatchConflictVersion,
      onFailure: () => toast(failureMessage),
    });

    if (updated) {
      await invalidateArtifactProjections(queryClient, target);
      await invalidateArtifactProjections(queryClient, updated);
    }
  }

  async function deleteArtifact(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "spaceId" | "kind">>,
  ) {
    const target = resolveArtifactRef(artifact);

    if (target.kind === "conversation") {
      await apiClient.deleteConversation(target.id);
    } else {
      await apiClient.deleteDocument(target.id);
      removeFromCollection(documentsCollection, target.id);
    }

    removeFromCollection(artifactsCollection, target.id);
    spaceTabs.removeArtifactTabEverywhere(target.id);
    await invalidateArtifactProjections(queryClient, target);

    const activeDocumentId = route.params.documentId as ArtifactId | undefined;
    const activeConversationId = route.params.conversationId as ArtifactId | undefined;
    const isActive = activeDocumentId === target.id || activeConversationId === target.id;

    if (isActive) {
      if (target.spaceId) {
        await router.push({ name: "space", params: { spaceId: target.spaceId } });
      } else {
        await router.push({ name: "home" });
      }
    }
  }

  return {
    openArtifact,
    openDocument,
    renameArtifact,
    duplicateArtifact,
    deleteArtifact,
    moveArtifact,
  };
}
