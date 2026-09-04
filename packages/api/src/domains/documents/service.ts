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
import { isDocumentOnBoard, planningOwnerSpaceId, resolvePlanningSpaceId } from "../spaces/planning.js";
import { resolveTenantRootSpaceId } from "../spaces/service.js";
import { requireArtifactAccess, requireSpaceAccess } from "../tenancy/access.js";
import { canTransitionStage } from "../workflows/transitions.js";
import {
  findDocumentTypeById,
  findDocumentTypeByKey,
  findHomeDocumentTypeByKey,
  findStageById,
  firstIdleStage,
  provisionHomeDocumentTypes,
} from "../workflows/repository.js";
import { toDocumentTypeView } from "../workflows/service.js";
import { EMPTY_TIPTAP_DOC } from "./constants.js";
import { toDocumentView } from "./mapper.js";
import {
  RANK_STRIDE,
  computeRank,
  orderIdsForReindex,
  pickNeighbor,
  resolvePlaceBounds,
  strideRank,
} from "./rank.js";
import * as documentRepository from "./repository.js";

type DocumentTypeRow = NonNullable<Awaited<ReturnType<typeof findDocumentTypeById>>>;

async function ensureDocumentTypeAssigned(
  artifactRow: Parameters<typeof toDocumentView>[0],
  documentRow: documentRepository.DocumentRow,
  preferredKey: DocumentTypeKey = "doc",
): Promise<DocumentTypeRow | null> {
  if (documentRow.documentTypeId) {
    const existing = await findDocumentTypeById(documentRow.documentTypeId);
    if (existing) return existing;
  }

  let typeRow: DocumentTypeRow | null = null;

  if (artifactRow.spaceId) {
    const ownerId = await resolvePlanningSpaceId(artifactRow.spaceId);
    typeRow =
      (await findDocumentTypeByKey(ownerId, preferredKey)) ??
      (preferredKey !== "doc" ? await findDocumentTypeByKey(ownerId, "doc") : null) ??
      null;
  } else {
    const ownerId = artifactRow.createdBy as UserId;
    await provisionHomeDocumentTypes(ownerId);
    typeRow =
      (await findHomeDocumentTypeByKey(ownerId, preferredKey)) ??
      (preferredKey !== "doc" ? await findHomeDocumentTypeByKey(ownerId, "doc") : null) ??
      null;
  }

  if (!typeRow) return null;

  await documentRepository.updateDocumentBody({
    artifactId: artifactRow.id,
    documentTypeId: typeRow.id,
  });

  return typeRow;
}

async function resolveDocumentTypeRowForDocument(
  artifactRow: Parameters<typeof toDocumentView>[0],
  documentRow: documentRepository.DocumentRow,
  documentTypeKey: DocumentTypeKey | null | undefined,
): Promise<DocumentTypeRow | null> {
  if (documentRow.documentTypeId) {
    const byId = await findDocumentTypeById(documentRow.documentTypeId);
    if (byId) return byId;
  }
  if (!documentTypeKey || !artifactRow.spaceId) return null;

  const visited = new Set<SpaceId>();
  let spaceRow = await findSpaceById(artifactRow.spaceId);
  while (spaceRow && !visited.has(spaceRow.id)) {
    visited.add(spaceRow.id);
    const byKey = await findDocumentTypeByKey(spaceRow.id, documentTypeKey);
    if (byKey) return byKey;

    const planningId = planningOwnerSpaceId(spaceRow);
    if (planningId !== spaceRow.id) {
      spaceRow = await findSpaceById(planningId);
      continue;
    }

    if (!spaceRow.parentSpaceId) break;
    spaceRow = await findSpaceById(spaceRow.parentSpaceId);
  }

  return null;
}

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
  userId: UserId;
  space: SpaceRow | null;
  documentTypeKey?: DocumentTypeKey;
}) {
  const key =
    input.documentTypeKey ??
    (input.space && (input.space.showBacklog || input.space.showBoard) ? "issue" : "doc");

  if (!input.space) {
    await provisionHomeDocumentTypes(input.userId);
    const type = await findHomeDocumentTypeByKey(input.userId, key);
    if (!type) return { documentTypeId: null, stageId: null };
    if (!type.workflowId) return { documentTypeId: type.id, stageId: null };
    const idle = await firstIdleStage(type.workflowId);
    return { documentTypeId: type.id, stageId: idle?.id ?? null };
  }

  const ownerId = await resolvePlanningSpaceId(input.space.id);
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
    userId,
    space: parentSpace,
    ...(input.documentTypeKey ? { documentTypeKey: input.documentTypeKey } : {}),
  });
  const rank = spaceId ? await documentRepository.nextRankInSpace(spaceId) : RANK_STRIDE;

  const docTypeId = input.documentTypeId !== undefined ? input.documentTypeId : planning.documentTypeId;
  let customFields: Record<string, unknown> = {};
  if (input.properties) {
    if (docTypeId) {
      const docType = await findDocumentTypeById(docTypeId);
      const allowedKeys = new Set(docType?.properties?.map((p) => p.key) ?? []);
      for (const [key, val] of Object.entries(input.properties)) {
        if (allowedKeys.size === 0 || allowedKeys.has(key)) {
          customFields[key] = val;
        }
      }
    } else {
      customFields = input.properties;
    }
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
    documentTypeId: docTypeId,
    stageId: planning.stageId,
    rank,
    fields: customFields,
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

  await ensureDocumentTypeAssigned(artifactRow, documentRow);
  const resolvedDocumentRow =
    (await documentRepository.findDocumentBody(artifactRow.id)) ?? documentRow;

  const document = await mapDocument(artifactRow, resolvedDocumentRow);
  const typeRow = await resolveDocumentTypeRowForDocument(
    artifactRow,
    resolvedDocumentRow,
    document.documentTypeKey,
  );

  return {
    ok: true as const,
    document,
    documentType: typeRow ? toDocumentTypeView(typeRow) : null,
  };
}

async function placeInSpace(input: {
  movedId: ArtifactId;
  spaceId: SpaceId;
  stageId?: documentRepository.DocumentRow["stageId"];
  afterId?: ArtifactId | null | undefined;
  beforeId?: ArtifactId | null | undefined;
}): Promise<{ rank: number }> {
  const rows = await documentRepository.listRanksInSpace(input.spaceId);
  const others = rows.filter((row) => row.id !== input.movedId);
  const maxRank = others.reduce<number | null>(
    (max, row) => (max == null || row.rank > max ? row.rank : max),
    null,
  );

  const after = pickNeighbor(input.afterId, input.movedId, rows, input.spaceId, input.stageId);
  const before = pickNeighbor(input.beforeId, input.movedId, rows, input.spaceId, input.stageId);
  const bounds = resolvePlaceBounds(after, before);
  const computed = computeRank(bounds.afterRank, bounds.beforeRank, maxRank);

  if (computed.kind === "value") {
    return { rank: computed.rank };
  }

  const orderedIds = orderIdsForReindex(others, input.movedId, bounds.afterId, bounds.beforeId);
  await documentRepository.reindexSpaceRanks(input.spaceId, orderedIds);
  const index = orderedIds.indexOf(input.movedId);
  return { rank: index >= 0 ? strideRank(index) : RANK_STRIDE };
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

  const nextStageId = input.stageId !== undefined ? input.stageId : documentRow.stageId;
  const nextTitle = input.title ?? artifactRow.title;
  const nextBody: TipTapDoc = input.body ?? (documentRow.body as TipTapDoc);
  const wantsPlace = input.afterId !== undefined || input.beforeId !== undefined;
  const spaceChanged = nextSpaceId !== artifactRow.spaceId;

  let nextRank = documentRow.rank;
  if (!nextSpaceId) {
    nextRank = RANK_STRIDE;
  } else if (wantsPlace || spaceChanged) {
    const placed = await placeInSpace({
      movedId: artifactRow.id,
      spaceId: nextSpaceId,
      ...(wantsPlace && input.stageId !== undefined ? { stageId: nextStageId } : {}),
      ...(wantsPlace ? { afterId: input.afterId, beforeId: input.beforeId } : {}),
    });
    nextRank = placed.rank;
  }

  let nextFields = documentRow.fields;
  if (input.properties !== undefined) {
    const targetTypeId = input.documentTypeId !== undefined ? input.documentTypeId : documentRow.documentTypeId;
    const docType = targetTypeId ? await findDocumentTypeById(targetTypeId) : null;
    const allowedKeys = new Set(docType?.properties?.map((p) => p.key) ?? []);
    const merged: Record<string, unknown> = { ...(documentRow.fields as Record<string, unknown>) };
    for (const [key, val] of Object.entries(input.properties)) {
      if (allowedKeys.size === 0 || allowedKeys.has(key)) {
        if (val === null || val === undefined) {
          delete merged[key];
        } else {
          merged[key] = val;
        }
      }
    }
    nextFields = merged;
  }

  const unchanged =
    nextSpaceId === artifactRow.spaceId &&
    nextStageId === documentRow.stageId &&
    nextTitle === artifactRow.title &&
    input.body === undefined &&
    input.documentTypeId === undefined &&
    input.properties === undefined &&
    nextRank === documentRow.rank;

  if (unchanged) {
    return { ok: true as const, document: await mapDocument(artifactRow, documentRow) };
  }

  const updatedArtifact = await artifactRepository.updateArtifactWithVersion({
    artifactId: artifactRow.id,
    expectedVersion: input.version,
    title: nextTitle,
    ...(input.spaceId !== undefined ? { spaceId: nextSpaceId, rootSpaceId: nextRootSpaceId } : {}),
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
    rank: nextRank,
    ...(input.stageId !== undefined ? { stageId: input.stageId } : {}),
    ...(input.documentTypeId !== undefined ? { documentTypeId: input.documentTypeId } : {}),
    fields: nextFields,
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
    : RANK_STRIDE;

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
