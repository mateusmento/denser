import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { conversation } from "../../db/schema/conversation.js";
import { conversationPeer } from "../../db/schema/conversation-peer.js";
import { dmSidebarPreference } from "../../db/schema/dm-sidebar-preference.js";
import { space, spaceMembership } from "../../db/schema/space.js";

type ArtifactRow = typeof artifact.$inferSelect;

export type ConversationRow = typeof conversation.$inferSelect;

export function buildMemberSetKey(userIds: readonly UserId[]): string {
  return [...new Set(userIds)].sort().join(":");
}

export async function findConversationByArtifactId(
  artifactId: ArtifactId,
): Promise<ConversationRow | undefined> {
  return db.query.conversation.findFirst({
    where: eq(conversation.artifactId, artifactId),
  });
}

export async function insertRegularConversationRow(
  artifactId: ArtifactId,
): Promise<ConversationRow> {
  const [created] = await db
    .insert(conversation)
    .values({
      artifactId,
      conversationKind: "regular",
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create conversation row");
  }

  return created;
}

export async function findDirectConversationByMemberSet(
  rootSpaceId: SpaceId,
  memberSetKey: string,
): Promise<{ artifact: ArtifactRow; conversation: ConversationRow } | undefined> {
  const rows = await db
    .select({
      artifact,
      conversation,
    })
    .from(conversation)
    .innerJoin(artifact, eq(artifact.id, conversation.artifactId))
    .where(
      and(
        eq(conversation.conversationKind, "direct"),
        eq(conversation.rootSpaceId, rootSpaceId),
        eq(conversation.memberSetKey, memberSetKey),
      ),
    )
    .limit(1);

  return rows[0];
}

export async function insertDirectConversationRows(input: {
  artifactId: ArtifactId;
  rootSpaceId: SpaceId;
  memberSetKey: string;
  peerUserIds: readonly UserId[];
}): Promise<ConversationRow> {
  return db.transaction(async (tx) => {
    const [createdConversation] = await tx
      .insert(conversation)
      .values({
        artifactId: input.artifactId,
        conversationKind: "direct",
        rootSpaceId: input.rootSpaceId,
        memberSetKey: input.memberSetKey,
      })
      .returning();

    if (!createdConversation) {
      throw new Error("Failed to create direct conversation row");
    }

    if (input.peerUserIds.length > 0) {
      await tx.insert(conversationPeer).values(
        input.peerUserIds.map((userId) => ({
          conversationArtifactId: input.artifactId,
          userId,
        })),
      );
    }

    return createdConversation;
  });
}

export async function isConversationPeer(
  userId: UserId,
  conversationArtifactId: ArtifactId,
): Promise<boolean> {
  const row = await db.query.conversationPeer.findFirst({
    where: and(
      eq(conversationPeer.conversationArtifactId, conversationArtifactId),
      eq(conversationPeer.userId, userId),
    ),
    columns: { userId: true },
  });
  return row != null;
}

export async function canAccessDirectConversation(
  userId: UserId,
  conversationArtifactId: ArtifactId,
  rootSpaceId: SpaceId,
): Promise<boolean> {
  if (!(await isConversationPeer(userId, conversationArtifactId))) {
    return false;
  }
  return assertUsersInRootSpaceTree(rootSpaceId, [userId]);
}

export async function listDirectConversationsForUser(
  rootSpaceId: SpaceId,
  userId: UserId,
): Promise<{ artifact: ArtifactRow; conversation: ConversationRow }[]> {
  return db
    .select({
      artifact,
      conversation,
    })
    .from(conversationPeer)
    .innerJoin(conversation, eq(conversation.artifactId, conversationPeer.conversationArtifactId))
    .innerJoin(artifact, eq(artifact.id, conversation.artifactId))
    .leftJoin(
      dmSidebarPreference,
      and(
        eq(dmSidebarPreference.conversationArtifactId, conversation.artifactId),
        eq(dmSidebarPreference.userId, userId),
      ),
    )
    .where(
      and(
        eq(conversationPeer.userId, userId),
        eq(conversation.conversationKind, "direct"),
        eq(conversation.rootSpaceId, rootSpaceId),
        or(isNull(dmSidebarPreference.hidden), eq(dmSidebarPreference.hidden, false)),
      ),
    )
    .orderBy(desc(artifact.updatedAt));
}

export async function listPeerUserIds(conversationArtifactId: ArtifactId): Promise<UserId[]> {
  const rows = await db
    .select({ userId: conversationPeer.userId })
    .from(conversationPeer)
    .where(eq(conversationPeer.conversationArtifactId, conversationArtifactId));

  return rows.map((row) => row.userId);
}

export async function setDirectConversationHidden(
  userId: UserId,
  conversationArtifactId: ArtifactId,
  hidden: boolean,
): Promise<void> {
  await db
    .insert(dmSidebarPreference)
    .values({
      userId,
      conversationArtifactId,
      hidden,
    })
    .onConflictDoUpdate({
      target: [dmSidebarPreference.userId, dmSidebarPreference.conversationArtifactId],
      set: {
        hidden,
        updatedAt: new Date(),
      },
    });
}

export async function assertUsersInRootSpaceTree(
  rootSpaceId: SpaceId,
  userIds: readonly UserId[],
): Promise<boolean> {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return true;

  const rows = await db
    .selectDistinct({ userId: spaceMembership.userId })
    .from(spaceMembership)
    .innerJoin(space, eq(space.id, spaceMembership.spaceId))
    .where(
      and(
        inArray(spaceMembership.userId, uniqueUserIds),
        or(eq(spaceMembership.spaceId, rootSpaceId), eq(space.rootSpaceId, rootSpaceId)),
      ),
    );

  return rows.length === uniqueUserIds.length;
}
