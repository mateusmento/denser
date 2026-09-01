import type { DocumentTypeId } from "@denser/contracts";
import { PatchDocumentTypeInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { patchDocumentType } from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const documentTypeRoutes = new Hono<{ Variables: Variables }>()
  .patch("/document-types/:documentTypeId", zValidator("json", PatchDocumentTypeInput), async (c) => {
    const documentTypeId = c.req.param("documentTypeId") as DocumentTypeId;
    const result = await patchDocumentType(documentTypeId, c.req.valid("json"));

    if (!result.ok) {
      return c.json({ error: "Document type not found" }, 404);
    }

    return c.json({ documentType: result.documentType });
  });
