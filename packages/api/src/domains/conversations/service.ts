import type {
  ArtifactId,
  ConversationView,
  CreateConversationInput,
  CreateDirectConversationInput,
  PatchConversationInput,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { user } from "../../db/schema/auth.js";
import type { ArtifactRow } from "../artifacts/repository.js";
import * as artifactRepository from "../artifacts/repository.js";
import { findUserByUsername } from "../spaces/membership-repository.js";
import { resolveTenantRootSpaceId } from "../spaces/service.js";
import { requireArtifactAccess, requireSpaceAccess, canAccessSpace } from "../tenancy/access.js";
import { findSpaceById } from "../spaces/repository.js";
import { toConversationView } from "./mapper.js";
import type { ConversationRow } from "./repository.js";
import * as conversationRepository from "./repository.js";

async function enrichDirectConversationView(
  userId: UserId,
  artifactRow: ArtifactRow,
  conversationRow: ConversationRow,
): Promise<ConversationView> {
  const base = toConversationView(artifactRow, conversationRow);
  if (conversationRow.conversationKind !== "direct") {
    return base;
  }

  const peerIds = await conversationRepository.listPeerUserIds(artifactRow.id);
  const otherIds = peerIds.filter((id) => id !== userId);
  const title = await buildDirectConversationTitle(userId, otherIds);
  return {
    ...base,
    title,
    peerUserId: otherIds.length === 1 ? otherIds[0]! : null,
  };
}

async function buildDirectConversationTitle(
  creatorId: UserId,
  memberUserIds: readonly UserId[],
): Promise<string> {
  const allIds = [...new Set([creatorId, ...memberUserIds])];
  const rows = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, allIds));

  const namesById = new Map(rows.map((row) => [row.id, row.name]));
  const otherNames = allIds
    .filter((id) => id !== creatorId)
    .map((id) => namesById.get(id) ?? "Unknown");

  if (otherNames.length === 0) return "Direct message";
  if (otherNames.length === 1) return otherNames[0]!;
  if (otherNames.length === 2) return `${otherNames[0]} and ${otherNames[1]}`;
  return `${otherNames[0]} and ${otherNames.length - 1} others`;
}

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
  const conversationRow = await conversationRepository.insertRegularConversationRow(artifactRow.id);

  return { ok: true as const, conversation: toConversationView(artifactRow, conversationRow) };
}

export async function createOrOpenDirectConversation(
  userId: UserId,
  input: CreateDirectConversationInput,
) {
  const rootSpace = await requireSpaceAccess(userId, input.rootSpaceId);
  if (!rootSpace || rootSpace.parentSpaceId !== null || rootSpace.visibility !== "private") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const otherMemberIds = await resolveDirectMemberIds(input);
  if (!otherMemberIds.ok) {
    return { ok: false as const, reason: otherMemberIds.reason };
  }

  const otherUserIds = [...new Set(otherMemberIds.userIds.filter((id) => id !== userId))];
  if (otherUserIds.length === 0) {
    return { ok: false as const, reason: "invalid_members" as const };
  }

  const allMemberIds = [userId, ...otherUserIds];
  const allAreMembers = await conversationRepository.assertUsersInRootSpaceTree(
    input.rootSpaceId,
    allMemberIds,
  );
  if (!allAreMembers) {
    return { ok: false as const, reason: "invalid_members" as const };
  }

  if (input.spaceId) {
    const contextSpace = await findSpaceById(input.spaceId);
    if (!contextSpace || !(await canAccessSpace(userId, input.spaceId))) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const contextRoot = resolveTenantRootSpaceId(contextSpace);
    if (contextRoot !== input.rootSpaceId) {
      return { ok: false as const, reason: "not_found" as const };
    }
  }

  const memberSetKey = conversationRepository.buildMemberSetKey(allMemberIds);
  const existing = await conversationRepository.findDirectConversationByMemberSet(
    input.rootSpaceId,
    memberSetKey,
  );
  if (existing) {
    await conversationRepository.setDirectConversationHidden(userId, existing.artifact.id, false);
    return {
      ok: true as const,
      conversation: await enrichDirectConversationView(
        userId,
        existing.artifact,
        existing.conversation,
      ),
      created: false as const,
    };
  }

  const title = input.title ?? (await buildDirectConversationTitle(userId, otherUserIds));
  const spaceId: SpaceId | null = input.spaceId ?? null;

  const artifactRow = await artifactRepository.insertConversationArtifact({
    title,
    spaceId,
    rootSpaceId: spaceId != null ? input.rootSpaceId : null,
    createdBy: userId,
  });

  const conversationRow = await conversationRepository.insertDirectConversationRows({
    artifactId: artifactRow.id,
    rootSpaceId: input.rootSpaceId,
    memberSetKey,
    peerUserIds: allMemberIds,
  });

  return {
    ok: true as const,
    conversation: await enrichDirectConversationView(userId, artifactRow, conversationRow),
    created: true as const,
  };
}

export async function listDirectConversations(userId: UserId, rootSpaceId: SpaceId) {
  const rootSpace = await requireSpaceAccess(userId, rootSpaceId);
  if (!rootSpace || rootSpace.parentSpaceId !== null || rootSpace.visibility !== "private") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await conversationRepository.listDirectConversationsForUser(rootSpaceId, userId);
  const conversations = await Promise.all(
    rows.map((row) => enrichDirectConversationView(userId, row.artifact, row.conversation)),
  );
  return {
    ok: true as const,
    conversations,
  };
}

export async function getConversation(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const conversationRow = await ensureConversationRow(artifactId);
  if (!conversationRow) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return {
    ok: true as const,
    conversation: await enrichDirectConversationView(userId, artifactRow, conversationRow),
  };
}

async function ensureConversationRow(artifactId: ArtifactId) {
  const existing = await conversationRepository.findConversationByArtifactId(artifactId);
  if (existing) return existing;

  const artifactRow = await artifactRepository.findArtifactById(artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") return null;

  return conversationRepository.insertRegularConversationRow(artifactId);
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

  const conversationRow = await ensureConversationRow(artifactId);
  if (!conversationRow) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (artifactRow.version !== input.version) {
    return {
      ok: false as const,
      reason: "conflict" as const,
      conversation: toConversationView(artifactRow, conversationRow),
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

  return {
    ok: true as const,
    conversation: toConversationView(updatedArtifact, conversationRow),
  };
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

export async function resolveActiveRootSpaceId(
  userId: UserId,
  spaceId?: SpaceId,
): Promise<SpaceId | null> {
  if (!spaceId) return null;
  const spaceRow = await requireSpaceAccess(userId, spaceId);
  if (!spaceRow) return null;
  return resolveTenantRootSpaceId(spaceRow);
}

async function resolveDirectMemberIds(
  input: CreateDirectConversationInput,
): Promise<
  { ok: true; userIds: UserId[] } | { ok: false; reason: "invalid_members" | "user_not_found" }
> {
  if (input.memberUserIds?.length) {
    const userIds = [...new Set(input.memberUserIds)];
    if (userIds.length === 0) {
      return { ok: false, reason: "invalid_members" };
    }
    return { ok: true, userIds };
  }

  const usernames = [...new Set(input.memberUsernames ?? [])];
  if (usernames.length === 0) {
    return { ok: false, reason: "invalid_members" };
  }

  const userIds: UserId[] = [];
  for (const username of usernames) {
    const user = await findUserByUsername(username);
    if (!user) {
      return { ok: false, reason: "user_not_found" };
    }
    userIds.push(user.id);
  }

  return { ok: true, userIds };
}

export async function hideDirectConversation(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const conversationRow = await conversationRepository.findConversationByArtifactId(artifactId);
  if (!conversationRow || conversationRow.conversationKind !== "direct") {
    return { ok: false as const, reason: "not_found" as const };
  }

  await conversationRepository.setDirectConversationHidden(userId, artifactId, true);
  return { ok: true as const, hidden: true as const };
}

export async function unhideDirectConversation(userId: UserId, artifactId: ArtifactId) {
  const artifactRow = await requireArtifactAccess(userId, artifactId);
  if (!artifactRow || artifactRow.kind !== "conversation") {
    return { ok: false as const, reason: "not_found" as const };
  }

  const conversationRow = await conversationRepository.findConversationByArtifactId(artifactId);
  if (!conversationRow || conversationRow.conversationKind !== "direct") {
    return { ok: false as const, reason: "not_found" as const };
  }

  await conversationRepository.setDirectConversationHidden(userId, artifactId, false);
  return { ok: true as const, hidden: false as const };
}
