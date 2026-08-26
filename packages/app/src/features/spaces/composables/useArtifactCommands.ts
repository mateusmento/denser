import type { ArtifactId, ArtifactSummary } from "@denser/contracts";
import { ApiConflictError } from "@denser/api-client";
import type { QueryClient } from "@tanstack/vue-query";
import { useQueryClient } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";
import { documentDisplayTitle } from "@/features/document/lib/document-content";
import { apiClient } from "@/lib/api";
import { confirm, prompt } from "@/lib/dialog";
import {
  artifactsCollection,
  documentsCollection,
  removeFromCollection,
  upsertInCollection,
} from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";

type ArtifactRef = Pick<ArtifactSummary, "id" | "title" | "version" | "spaceId">;

function resolveArtifactRef(
  artifact: Pick<ArtifactSummary, "id" | "title"> &
    Partial<Pick<ArtifactSummary, "version" | "spaceId">>,
): ArtifactRef {
  const cached = artifactsCollection.get(artifact.id);
  const document = documentsCollection.get(artifact.id);
  return {
    id: artifact.id,
    title: artifact.title,
    version: artifact.version ?? document?.version ?? cached?.version ?? 0,
    spaceId: artifact.spaceId ?? document?.spaceId ?? cached?.spaceId ?? null,
  };
}

async function resolveArtifactVersion(artifactId: ArtifactId): Promise<number> {
  const cached = artifactsCollection.get(artifactId);
  if (cached?.version) return cached.version;

  const document = documentsCollection.get(artifactId);
  if (document?.version) return document.version;

  const { document: loaded } = await apiClient.getDocument(artifactId);
  upsertInCollection(artifactsCollection, loaded);
  upsertInCollection(documentsCollection, loaded);
  return loaded.version;
}

export async function invalidateArtifactProjections(
  queryClient: QueryClient,
  artifact: Pick<ArtifactSummary, "id" | "spaceId">,
) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.home() });
  await queryClient.invalidateQueries({ queryKey: queryKeys.document(artifact.id) });
  if (artifact.spaceId) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.space(artifact.spaceId) });
  }
}

function applyArtifactPatch(document: ArtifactSummary) {
  upsertInCollection(artifactsCollection, document);
  const fullDocument = documentsCollection.get(document.id);
  if (fullDocument) {
    upsertInCollection(documentsCollection, { ...fullDocument, ...document });
  }
}

export function useArtifactCommands() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const route = useRoute();

  async function renameArtifactWithDialog(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "version" | "spaceId">>,
  ) {
    const target = resolveArtifactRef(artifact);
    const title = await prompt({
      title: "Rename document",
      label: "Name",
      defaultValue: target.title,
      confirmLabel: "Save",
    });
    if (!title?.trim() || title.trim() === target.title) return;
    await renameArtifact(target, title.trim());
  }

  async function renameArtifact(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "version" | "spaceId">>,
    title: string,
  ) {
    const target = resolveArtifactRef(artifact);
    const trimmed = title.trim();
    if (!trimmed || trimmed === target.title) return;

    let version = target.version > 0 ? target.version : await resolveArtifactVersion(target.id);
    let attempt = 0;

    while (attempt < 3) {
      attempt += 1;
      try {
        const { document } = await apiClient.patchDocument(target.id, { title: trimmed, version });
        applyArtifactPatch(document);
        await invalidateArtifactProjections(queryClient, document);
        return;
      } catch (error) {
        if (!(error instanceof ApiConflictError)) throw error;
        applyArtifactPatch(error.conflict.document);
        version = error.conflict.document.version;
        if (attempt >= 2) throw error;
      }
    }
  }

  async function openDocument(artifactId: ArtifactId) {
    await router.push({ name: "document", params: { documentId: artifactId } });
  }

  async function duplicateArtifact(artifact: Pick<ArtifactSummary, "id">) {
    const { document } = await apiClient.duplicateDocument(artifact.id);
    upsertInCollection(documentsCollection, document);
    const { body: _body, ...summary } = document;
    upsertInCollection(artifactsCollection, summary);
    await invalidateArtifactProjections(queryClient, document);
    await router.push({ name: "document", params: { documentId: document.id } });
  }

  async function deleteArtifact(
    artifact: Pick<ArtifactSummary, "id" | "title"> &
      Partial<Pick<ArtifactSummary, "spaceId">>,
  ) {
    const target = resolveArtifactRef(artifact);
    const confirmed = await confirm({
      title: `Delete “${documentDisplayTitle(target.title)}”?`,
      description: "This document will be permanently deleted.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    await apiClient.deleteDocument(target.id);
    removeFromCollection(artifactsCollection, target.id);
    removeFromCollection(documentsCollection, target.id);
    await invalidateArtifactProjections(queryClient, target);

    const activeDocumentId = route.params.documentId as ArtifactId | undefined;
    if (activeDocumentId === target.id) {
      if (target.spaceId) {
        await router.push({ name: "space", params: { spaceId: target.spaceId } });
      } else {
        await router.push({ name: "home" });
      }
    }
  }

  return {
    openDocument,
    renameArtifact,
    renameArtifactWithDialog,
    duplicateArtifact,
    deleteArtifact,
  };
}
