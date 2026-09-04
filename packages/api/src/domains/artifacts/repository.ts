import type { ArtifactId, ArtifactSummary, SpaceId, UserId } from "@denser/contracts";
import { and, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { conversation } from "../../db/schema/conversation.js";
import { document } from "../../db/schema/document.js";
import { documentType, workflowStage } from "../../db/schema/workflow.js";
import { toArtifactSummary } from "./mapper.js";

export type ArtifactRow = typeof artifact.$inferSelect;

export async function findArtifactById(artifactId: ArtifactId): Promise<ArtifactRow | undefined> {
  return db.query.artifact.findFirst({ where: eq(artifact.id, artifactId) });
}

export async function listRootArtifactsByOwner(userId: UserId): Promise<ArtifactRow[]> {
  return db
    .select()
    .from(artifact)
    .where(and(eq(artifact.createdBy, userId), isNull(artifact.spaceId)))
    .orderBy(desc(artifact.updatedAt));
}

export async function listArtifactsInSpace(spaceId: SpaceId): Promise<ArtifactRow[]> {
  return listRegularArtifactsInSpace(spaceId);
}

export async function listRegularArtifactsInSpace(spaceId: SpaceId): Promise<ArtifactRow[]> {
  return listRegularArtifactsInSpaces([spaceId]);
}

export async function listRegularArtifactsInSpaces(
  spaceIds: readonly SpaceId[],
): Promise<ArtifactRow[]> {
  if (spaceIds.length === 0) return [];
  return db
    .select({ artifact })
    .from(artifact)
    .leftJoin(conversation, eq(conversation.artifactId, artifact.id))
    .where(
      and(
        inArray(artifact.spaceId, spaceIds),
        or(ne(artifact.kind, "conversation"), eq(conversation.conversationKind, "regular")),
      ),
    )
    .orderBy(desc(artifact.updatedAt))
    .then((rows) => rows.map((row) => row.artifact));
}

export async function listArtifactSummariesInSpaces(
  spaceIds: readonly SpaceId[],
): Promise<ArtifactSummary[]> {
  if (spaceIds.length === 0) return [];
  const rows = await db
    .select({
      artifact,
      rank: document.rank,
      stageId: document.stageId,
      documentTypeId: document.documentTypeId,
      stageName: workflowStage.name,
      stageKind: workflowStage.kind,
      documentTypeKey: documentType.key,
      properties: document.fields,
    })
    .from(artifact)
    .leftJoin(conversation, eq(conversation.artifactId, artifact.id))
    .leftJoin(document, eq(document.artifactId, artifact.id))
    .leftJoin(workflowStage, eq(document.stageId, workflowStage.id))
    .leftJoin(documentType, eq(document.documentTypeId, documentType.id))
    .where(
      and(
        inArray(artifact.spaceId, spaceIds),
        or(ne(artifact.kind, "conversation"), eq(conversation.conversationKind, "regular")),
      ),
    )
    .orderBy(desc(artifact.updatedAt));

  return rows.map((row) =>
    toArtifactSummary(
      row.artifact,
      row.artifact.kind === "document"
        ? {
            rank: row.rank ?? 0,
            stageId: row.stageId ?? null,
            stageName: row.stageName ?? null,
            stageKind: row.stageKind ?? null,
            documentTypeId: row.documentTypeId ?? null,
            documentTypeKey: row.documentTypeKey ?? null,
            properties: (row.properties as Record<string, unknown> | null) ?? {},
          }
        : undefined,
    ),
  );
}

export async function insertDocumentArtifact(input: {
  title: string;
  spaceId: SpaceId | null;
  rootSpaceId: SpaceId | null;
  createdBy: UserId;
}): Promise<ArtifactRow> {
  const [created] = await db
    .insert(artifact)
    .values({
      kind: "document",
      title: input.title,
      spaceId: input.spaceId,
      rootSpaceId: input.rootSpaceId,
      createdBy: input.createdBy,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create artifact");
  }

  return created;
}

export async function insertConversationArtifact(input: {
  title: string;
  spaceId: SpaceId | null;
  rootSpaceId: SpaceId | null;
  createdBy: UserId;
}): Promise<ArtifactRow> {
  const [created] = await db
    .insert(artifact)
    .values({
      kind: "conversation",
      title: input.title,
      spaceId: input.spaceId,
      rootSpaceId: input.rootSpaceId,
      createdBy: input.createdBy,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create conversation artifact");
  }

  return created;
}

export async function updateArtifactWithVersion(input: {
  artifactId: ArtifactId;
  expectedVersion: number;
  title: string;
  spaceId?: SpaceId | null;
  rootSpaceId?: SpaceId | null;
}): Promise<ArtifactRow | null> {
  const [updated] = await db
    .update(artifact)
    .set({
      title: input.title,
      version: input.expectedVersion + 1,
      updatedAt: new Date(),
      ...(input.spaceId !== undefined ? { spaceId: input.spaceId } : {}),
      ...(input.rootSpaceId !== undefined ? { rootSpaceId: input.rootSpaceId } : {}),
    })
    .where(and(eq(artifact.id, input.artifactId), eq(artifact.version, input.expectedVersion)))
    .returning();

  return updated ?? null;
}

export async function deleteArtifactById(artifactId: ArtifactId): Promise<void> {
  await db.delete(artifact).where(eq(artifact.id, artifactId));
}
