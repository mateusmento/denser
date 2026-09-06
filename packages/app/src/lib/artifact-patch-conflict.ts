import { artifactsCollection, documentsCollection, upsertInCollection } from "@/lib/db";
import { ApiConflictError, ApiConversationConflictError } from "@denser/api-client";
import type { ArtifactSummary } from "@denser/contracts";

export function applyArtifactPatch(artifact: ArtifactSummary) {
  upsertInCollection(artifactsCollection, artifact);
  if (artifact.kind === "document") {
    const fullDocument = documentsCollection.get(artifact.id);
    if (fullDocument) {
      upsertInCollection(documentsCollection, { ...fullDocument, ...artifact });
    }
  }
}

/** Upsert a 409 conflict body and return the server version to retry with. */
export function artifactPatchConflictVersion(error: unknown): number | null {
  if (error instanceof ApiConversationConflictError) {
    upsertInCollection(artifactsCollection, error.conflict.conversation);
    return error.conflict.conversation.version;
  }
  if (error instanceof ApiConflictError) {
    applyArtifactPatch(error.conflict.document);
    return error.conflict.document.version;
  }
  return null;
}
