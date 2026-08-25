import type {
  ArtifactId,
  CreateDocumentInput,
  PatchDocumentInput,
  SpaceId,
  TipTapDoc,
  UserId,
} from "@denser/contracts";
import * as artifactRepository from "../artifacts/repository.js";
import { resolveTenantRootSpaceId } from "../spaces/service.js";
import { requireArtifactAccess, requireSpaceAccess } from "../tenancy/access.js";
import { EMPTY_TIPTAP_DOC } from "./constants.js";
import { toDocumentView } from "./mapper.js";
import * as documentRepository from "./repository.js";

export async function createDocument(userId: UserId, input: CreateDocumentInput) {
  const title = input.title ?? "Untitled";
  const body: TipTapDoc = input.body ?? EMPTY_TIPTAP_DOC;

  let spaceId: SpaceId | null = null;
  let rootSpaceId: SpaceId | null = null;

  if (input.spaceId) {
    const parentSpace = await requireSpaceAccess(userId, input.spaceId);
    if (!parentSpace) {
      return { ok: false as const, reason: "not_found" as const };
    }
    spaceId = parentSpace.id;
    rootSpaceId = resolveTenantRootSpaceId(parentSpace);
  }

  const artifactRow = await artifactRepository.insertDocumentArtifact({
    title,
    spaceId,
    rootSpaceId,
    createdBy: userId,
  });

  const documentRow = await documentRepository.insertDocumentBody({
    artifactId: artifactRow.id,
    body,
  });

  return { ok: true as const, document: toDocumentView(artifactRow, documentRow) };
}

export async function getDocument(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "document") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const documentRow = await documentRepository.findDocumentBody(artifactRow.id);
  if (!documentRow) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, document: toDocumentView(artifactRow, documentRow) };
}

export async function patchDocument(
  userId: UserId,
  artifactId: ArtifactId,
  input: PatchDocumentInput,
) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "document") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const documentRow = await documentRepository.findDocumentBody(artifactRow.id);
  if (!documentRow) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (artifactRow.version !== input.version) {
    return {
      ok: false as const,
      reason: "conflict" as const,
      document: toDocumentView(artifactRow, documentRow),
    };
  }

  const nextTitle = input.title ?? artifactRow.title;
  const nextBody: TipTapDoc = input.body ?? (documentRow.body as TipTapDoc);

  const updatedArtifact = await artifactRepository.updateArtifactWithVersion({
    artifactId: artifactRow.id,
    expectedVersion: input.version,
    title: nextTitle,
  });

  if (!updatedArtifact) {
    const currentArtifact = await artifactRepository.findArtifactById(artifactRow.id);
    const currentDocument = currentArtifact
      ? await documentRepository.findDocumentBody(currentArtifact.id)
      : undefined;

    if (currentArtifact && currentDocument) {
      return {
        ok: false as const,
        reason: "conflict" as const,
        document: toDocumentView(currentArtifact, currentDocument),
      };
    }

    return { ok: false as const, reason: "not_found" as const };
  }

  const updatedDocument = await documentRepository.updateDocumentBody({
    artifactId: artifactRow.id,
    body: nextBody,
  });

  if (!updatedDocument) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, document: toDocumentView(updatedArtifact, updatedDocument) };
}
