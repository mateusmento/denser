import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { conversation, conversationMember } from "../../db/schema/conversation.js";
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
  memberUserIds: readonly UserId[];
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

    if (input.memberUserIds.length > 0) {
      await tx.insert(conversationMember).values(
        input.memberUserIds.map((userId) => ({
          conversationArtifactId: input.artifactId,
          userId,
        })),
      );
    }

    return createdConversation;
  });
}

export async function isConversationMember(
  userId: UserId,
  conversationArtifactId: ArtifactId,
): Promise<boolean> {
  const row = await db.query.conversationMember.findFirst({
    where: and(
      eq(conversationMember.conversationArtifactId, conversationArtifactId),
      eq(conversationMember.userId, userId),
    ),
    columns: { userId: true },
  });
  return row != null;
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
    .from(conversationMember)
    .innerJoin(conversation, eq(conversation.artifactId, conversationMember.conversationArtifactId))
    .innerJoin(artifact, eq(artifact.id, conversation.artifactId))
    .where(
      and(
        eq(conversationMember.userId, userId),
        eq(conversation.conversationKind, "direct"),
        eq(conversation.rootSpaceId, rootSpaceId),
      ),
    )
    .orderBy(desc(artifact.updatedAt));
}

export async function listMemberUserIds(conversationArtifactId: ArtifactId): Promise<UserId[]> {
  const rows = await db
    .select({ userId: conversationMember.userId })
    .from(conversationMember)
    .where(eq(conversationMember.conversationArtifactId, conversationArtifactId));

  return rows.map((row) => row.userId);
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
