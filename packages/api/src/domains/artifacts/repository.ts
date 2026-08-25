import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";

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
  return db
    .select()
    .from(artifact)
    .where(eq(artifact.spaceId, spaceId))
    .orderBy(desc(artifact.updatedAt));
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

export async function updateArtifactWithVersion(input: {
  artifactId: ArtifactId;
  expectedVersion: number;
  title: string;
}): Promise<ArtifactRow | null> {
  const [updated] = await db
    .update(artifact)
    .set({
      title: input.title,
      version: input.expectedVersion + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(artifact.id, input.artifactId), eq(artifact.version, input.expectedVersion)))
    .returning();

  return updated ?? null;
}
