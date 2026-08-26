import type {
  ArtifactId,
  CreateConversationInput,
  PatchConversationInput,
  SpaceId,
  UserId,
} from "@denser/contracts";
import * as artifactRepository from "../artifacts/repository.js";
import { resolveTenantRootSpaceId } from "../spaces/service.js";
import { requireArtifactAccess, requireSpaceAccess } from "../tenancy/access.js";
import { toConversationView } from "./mapper.js";

export async function createConversation(userId: UserId, input: CreateConversationInput) {
  const title = input.title ?? "";
  // initialMessage is accepted for future create+send; not persisted in v1.

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

  const artifactRow = await artifactRepository.insertConversationArtifact({
    title,
    spaceId,
    rootSpaceId,
    createdBy: userId,
  });

  return { ok: true as const, conversation: toConversationView(artifactRow) };
}

export async function getConversation(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, conversation: toConversationView(artifactRow) };
}

export async function patchConversation(
  userId: UserId,
  artifactId: ArtifactId,
  input: PatchConversationInput,
) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (artifactRow.version !== input.version) {
    return {
      ok: false as const,
      reason: "conflict" as const,
      conversation: toConversationView(artifactRow),
    };
  }

  const nextTitle = input.title !== undefined ? input.title : artifactRow.title;
  const updatedArtifact = await artifactRepository.updateArtifactWithVersion({
    artifactId: artifactRow.id,
    expectedVersion: artifactRow.version,
    title: nextTitle,
  });

  if (!updatedArtifact) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, conversation: toConversationView(updatedArtifact) };
}

export async function deleteConversation(
  userId: UserId,
  artifactId: ArtifactId,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  await artifactRepository.deleteArtifactById(artifactId);
  return { ok: true as const };
}
