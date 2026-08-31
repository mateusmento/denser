import type {
  ArtifactId,
  DocumentTypeId,
  SpaceId,
  TipTapDoc,
  WorkflowStageId,
} from "@denser/contracts";
import { asc, eq, max } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { document } from "../../db/schema/document.js";
import { RANK_STRIDE, strideRank, type RankRow } from "./rank.js";

export type DocumentRow = typeof document.$inferSelect;

export async function findDocumentBody(artifactId: ArtifactId): Promise<DocumentRow | undefined> {
  return db.query.document.findFirst({ where: eq(document.artifactId, artifactId) });
}

export async function nextRankInSpace(spaceId: SpaceId): Promise<number> {
  const [row] = await db
    .select({ maxRank: max(document.rank) })
    .from(document)
    .innerJoin(artifact, eq(document.artifactId, artifact.id))
    .where(eq(artifact.spaceId, spaceId));
  return row?.maxRank == null ? RANK_STRIDE : row.maxRank + RANK_STRIDE;
}

export async function listRanksInSpace(spaceId: SpaceId): Promise<RankRow[]> {
  const rows = await db
    .select({
      id: document.artifactId,
      rank: document.rank,
      title: artifact.title,
      spaceId: artifact.spaceId,
      stageId: document.stageId,
    })
    .from(document)
    .innerJoin(artifact, eq(document.artifactId, artifact.id))
    .where(eq(artifact.spaceId, spaceId))
    .orderBy(asc(document.rank), asc(artifact.title));

  return rows.map((row) => ({
    id: row.id,
    rank: row.rank,
    title: row.title,
    spaceId: row.spaceId,
    stageId: row.stageId,
  }));
}

export async function reindexSpaceRanks(spaceId: SpaceId, orderedIds: readonly string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .select({ id: document.artifactId })
      .from(document)
      .innerJoin(artifact, eq(document.artifactId, artifact.id))
      .where(eq(artifact.spaceId, spaceId))
      .for("update");

    for (const [index, artifactId] of orderedIds.entries()) {
      await tx
        .update(document)
        .set({ rank: strideRank(index) })
        .where(eq(document.artifactId, artifactId as ArtifactId));
    }
  });
}

export async function insertDocumentBody(input: {
  artifactId: ArtifactId;
  body: TipTapDoc;
  documentTypeId?: DocumentTypeId | null;
  stageId?: WorkflowStageId | null;
  rank?: number;
}): Promise<DocumentRow> {
  const [created] = await db
    .insert(document)
    .values({
      artifactId: input.artifactId,
      body: input.body,
      documentTypeId: input.documentTypeId,
      stageId: input.stageId,
      rank: input.rank ?? 0,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create document body");
  }

  return created;
}

export async function updateDocumentBody(input: {
  artifactId: ArtifactId;
  body?: TipTapDoc;
  documentTypeId?: DocumentTypeId | null;
  stageId?: WorkflowStageId | null;
  rank?: number;
}): Promise<DocumentRow | null> {
  const values: Partial<typeof document.$inferInsert> = {};
  if (input.body !== undefined) values.body = input.body;
  if (input.documentTypeId !== undefined) values.documentTypeId = input.documentTypeId;
  if (input.stageId !== undefined) values.stageId = input.stageId;
  if (input.rank !== undefined) values.rank = input.rank;
  if (Object.keys(values).length === 0) {
    const current = await db.query.document.findFirst({
      where: eq(document.artifactId, input.artifactId),
    });
    return current ?? null;
  }

  const [updated] = await db
    .update(document)
    .set(values)
    .where(eq(document.artifactId, input.artifactId))
    .returning();

  return updated ?? null;
}
