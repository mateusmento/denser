import type { ArtifactId, UserId } from "@denser/contracts";
import { CreateDocumentInput, PatchDocumentInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createDocument, deleteDocument, duplicateDocument, getDocument, patchDocument } from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const documentRoutes = new Hono<{ Variables: Variables }>()
  .post("/documents", zValidator("json", CreateDocumentInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const result = await createDocument(userId, c.req.valid("json"));

    if (!result.ok) {
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({ document: result.document }, 201);
  })
  .get("/documents/:artifactId", async (c) => {
    const userId = c.get("user").id as UserId;
    const artifactId = c.req.param("artifactId") as ArtifactId;
    const result = await getDocument(userId, artifactId);

    if (!result.ok) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ document: result.document });
  })
  .post("/documents/:artifactId/duplicate", async (c) => {
    const userId = c.get("user").id as UserId;
    const artifactId = c.req.param("artifactId") as ArtifactId;
    const result = await duplicateDocument(userId, artifactId);

    if (!result.ok) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ document: result.document }, 201);
  })
  .patch("/documents/:artifactId", zValidator("json", PatchDocumentInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const artifactId = c.req.param("artifactId") as ArtifactId;
    const result = await patchDocument(userId, artifactId, c.req.valid("json"));

    if (result.reason === "conflict") {
      return c.json({ error: "conflict" as const, document: result.document }, 409);
    }

    if (!result.ok) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ document: result.document });
  })
  .delete("/documents/:artifactId", async (c) => {
    const userId = c.get("user").id as UserId;
    const artifactId = c.req.param("artifactId") as ArtifactId;
    const result = await deleteDocument(userId, artifactId);

    if (!result.ok) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.body(null, 204);
  });
