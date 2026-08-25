import type { ArtifactId, TipTapDoc } from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { document } from "../../db/schema/document.js";

export type DocumentRow = typeof document.$inferSelect;

export async function findDocumentBody(artifactId: ArtifactId): Promise<DocumentRow | undefined> {
  return db.query.document.findFirst({ where: eq(document.artifactId, artifactId) });
}

export async function insertDocumentBody(input: {
  artifactId: ArtifactId;
  body: TipTapDoc;
}): Promise<DocumentRow> {
  const [created] = await db
    .insert(document)
    .values({
      artifactId: input.artifactId,
      body: input.body,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create document body");
  }

  return created;
}

export async function updateDocumentBody(input: {
  artifactId: ArtifactId;
  body: TipTapDoc;
}): Promise<DocumentRow | null> {
  const [updated] = await db
    .update(document)
    .set({ body: input.body })
    .where(eq(document.artifactId, input.artifactId))
    .returning();

  return updated ?? null;
}
