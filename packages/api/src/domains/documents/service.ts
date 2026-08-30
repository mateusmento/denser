import type {
  ArtifactId,
  CreateDocumentInput,
  DocumentTypeKey,
  PatchDocumentInput,
  SpaceId,
  TipTapDoc,
  UserId,
} from "@denser/contracts";
import * as artifactRepository from "../artifacts/repository.js";
import { findSpaceById, type SpaceRow } from "../spaces/repository.js";
import { isDocumentOnBoard, planningOwnerSpaceId } from "../spaces/planning.js";
import { resolveTenantRootSpaceId } from "../spaces/service.js";
import { requireArtifactAccess, requireSpaceAccess } from "../tenancy/access.js";
import { canTransitionStage } from "../workflows/transitions.js";
import {
  findDocumentTypeById,
  findDocumentTypeByKey,
  findStageById,
  firstIdleStage,
} from "../workflows/repository.js";
import { EMPTY_TIPTAP_DOC } from "./constants.js";
import { toDocumentView } from "./mapper.js";
import * as documentRepository from "./repository.js";

async function mapDocument(
  artifactRow: Parameters<typeof toDocumentView>[0],
  documentRow: documentRepository.DocumentRow,
) {
  const [stage, documentType] = await Promise.all([
    documentRow.stageId ? findStageById(documentRow.stageId) : Promise.resolve(undefined),
    documentRow.documentTypeId
      ? findDocumentTypeById(documentRow.documentTypeId)
      : Promise.resolve(undefined),
  ]);
  return toDocumentView(artifactRow, documentRow, {
    stage: stage ?? null,
    documentType: documentType ?? null,
  });
}

async function resolveCreateType(input: {
  space: SpaceRow | null;
  documentTypeKey?: DocumentTypeKey;
}) {
  if (!input.space) return { documentTypeId: null, stageId: null };
  const ownerId = planningOwnerSpaceId(input.space);
  const key =
    input.documentTypeKey ??
    (input.space.showBacklog || input.space.showBoard ? "issue" : "doc");
  const type = await findDocumentTypeByKey(ownerId, key);
  if (!type) return { documentTypeId: null, stageId: null };
  if (!type.workflowId) return { documentTypeId: type.id, stageId: null };
  const idle = await firstIdleStage(type.workflowId);
  return { documentTypeId: type.id, stageId: idle?.id ?? null };
}

export async function createDocument(userId: UserId, input: CreateDocumentInput) {
  const title = input.title ?? "";
  const body: TipTapDoc = input.body ?? EMPTY_TIPTAP_DOC;

  let spaceId: SpaceId | null = null;
  let rootSpaceId: SpaceId | null = null;
  let parentSpace: SpaceRow | null = null;

  if (input.spaceId) {
    parentSpace = (await requireSpaceAccess(userId, input.spaceId)) ?? null;
    if (!parentSpace) {
      return { ok: false as const, reason: "not_found" as const };
    }
    spaceId = parentSpace.id;
    rootSpaceId = resolveTenantRootSpaceId(parentSpace);
  }

  const planning = await resolveCreateType({
    space: parentSpace,
    ...(input.documentTypeKey ? { documentTypeKey: input.documentTypeKey } : {}),
  });
  const rank = spaceId ? await documentRepository.nextRankInSpace(spaceId) : 0;

  const artifactRow = await artifactRepository.insertDocumentArtifact({
    title,
    spaceId,
    rootSpaceId,
    createdBy: userId,
  });

  const documentRow = await documentRepository.insertDocumentBody({
    artifactId: artifactRow.id,
    body,
    documentTypeId: planning.documentTypeId,
    stageId: planning.stageId,
    rank,
  });

  return { ok: true as const, document: await mapDocument(artifactRow, documentRow) };
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

  return { ok: true as const, document: await mapDocument(artifactRow, documentRow) };
}

async function resolveMoveTarget(
  userId: UserId,
  nextSpaceId: SpaceId | null,
): Promise<{ ok: true; spaceId: SpaceId | null; rootSpaceId: SpaceId | null } | { ok: false }> {
  if (nextSpaceId === null) {
    return { ok: true, spaceId: null, rootSpaceId: null };
  }
  const target = await requireSpaceAccess(userId, nextSpaceId);
  if (!target) return { ok: false };
  return { ok: true, spaceId: target.id, rootSpaceId: resolveTenantRootSpaceId(target) };
}

async function validateStageChange(input: {
  artifactSpaceId: SpaceId | null;
  currentStageId: documentRepository.DocumentRow["stageId"];
  nextStageId: PatchDocumentInput["stageId"];
  documentTypeId: documentRepository.DocumentRow["documentTypeId"];
}): Promise<{ ok: true } | { ok: false; reason: "invalid_transition" }> {
  const nextStage = input.nextStageId ? await findStageById(input.nextStageId) : null;
  if (input.nextStageId && !nextStage) {
    return { ok: false, reason: "invalid_transition" };
  }

  if (!input.nextStageId) return { ok: true };
  if (!nextStage) return { ok: false, reason: "invalid_transition" };

  if (input.documentTypeId) {
    const type = await findDocumentTypeById(input.documentTypeId);
    if (type?.workflowId && type.workflowId !== nextStage.workflowId) {
      return { ok: false, reason: "invalid_transition" };
    }
  }

  if (!input.currentStageId) return { ok: true };

  const fromStage = await findStageById(input.currentStageId);
  if (!fromStage) return { ok: true };

  let owner: SpaceRow | undefined;
  if (input.artifactSpaceId) {
    const location = await findSpaceById(input.artifactSpaceId);
    if (location) {
      const ownerId = planningOwnerSpaceId(location);
      owner = ownerId === location.id ? location : await findSpaceById(ownerId);
    }
  }

  const onBoard = owner ? isDocumentOnBoard(input.artifactSpaceId, owner) : false;
  if (
    !canTransitionStage(
      {
        id: fromStage.id,
        kind: fromStage.kind,
        sort: fromStage.sort,
        allowedSourceStageIds: fromStage.allowedSourceStageIds,
      },
      {
        id: nextStage.id,
        kind: nextStage.kind,
        sort: nextStage.sort,
        allowedSourceStageIds: nextStage.allowedSourceStageIds,
      },
      onBoard,
    )
  ) {
    return { ok: false, reason: "invalid_transition" };
  }

  return { ok: true };
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
      document: await mapDocument(artifactRow, documentRow),
    };
  }

  let nextSpaceId = artifactRow.spaceId;
  let nextRootSpaceId = artifactRow.rootSpaceId;
  if (input.spaceId !== undefined) {
    const move = await resolveMoveTarget(userId, input.spaceId);
    if (!move.ok) {
      return { ok: false as const, reason: "not_found" as const };
    }
    nextSpaceId = move.spaceId;
    nextRootSpaceId = move.rootSpaceId;
  }

  if (input.stageId !== undefined) {
    const transition = await validateStageChange({
      artifactSpaceId: nextSpaceId,
      currentStageId: documentRow.stageId,
      nextStageId: input.stageId,
      documentTypeId: documentRow.documentTypeId,
    });
    if (!transition.ok) {
      return { ok: false as const, reason: "invalid_transition" as const };
    }
  }

  const nextTitle = input.title ?? artifactRow.title;
  const nextBody: TipTapDoc = input.body ?? (documentRow.body as TipTapDoc);

  const updatedArtifact = await artifactRepository.updateArtifactWithVersion({
    artifactId: artifactRow.id,
    expectedVersion: input.version,
    title: nextTitle,
    ...(input.spaceId !== undefined
      ? { spaceId: nextSpaceId, rootSpaceId: nextRootSpaceId }
      : {}),
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
        document: await mapDocument(currentArtifact, currentDocument),
      };
    }

    return { ok: false as const, reason: "not_found" as const };
  }

  const updatedDocument = await documentRepository.updateDocumentBody({
    artifactId: artifactRow.id,
    body: nextBody,
    ...(input.rank !== undefined ? { rank: input.rank } : {}),
    ...(input.stageId !== undefined ? { stageId: input.stageId } : {}),
  });

  if (!updatedDocument) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, document: await mapDocument(updatedArtifact, updatedDocument) };
}

export async function duplicateDocument(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "document") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const documentRow = await documentRepository.findDocumentBody(artifactRow.id);
  if (!documentRow) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const copyTitle = `${artifactRow.title} copy`;
  const body = structuredClone(documentRow.body as TipTapDoc);
  const rank = artifactRow.spaceId
    ? await documentRepository.nextRankInSpace(artifactRow.spaceId)
    : 0;

  const copiedArtifact = await artifactRepository.insertDocumentArtifact({
    title: copyTitle,
    spaceId: artifactRow.spaceId,
    rootSpaceId: artifactRow.rootSpaceId,
    createdBy: userId,
  });

  const copiedDocument = await documentRepository.insertDocumentBody({
    artifactId: copiedArtifact.id,
    body,
    documentTypeId: documentRow.documentTypeId,
    stageId: documentRow.stageId,
    rank,
  });

  return { ok: true as const, document: await mapDocument(copiedArtifact, copiedDocument) };
}

export async function deleteDocument(
  userId: UserId,
  artifactId: ArtifactId,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "document") {
    return { ok: false as const, reason: "not_found" as const };
  }

  await artifactRepository.deleteArtifactById(artifactId);
  return { ok: true as const };
}
