import type {
  ArtifactId,
  DocumentTypeId,
  SpaceId,
  TipTapDoc,
  WorkflowStageId,
} from "@denser/contracts";
import { eq, max } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { document } from "../../db/schema/document.js";

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
  return (row?.maxRank ?? -1) + 1;
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
