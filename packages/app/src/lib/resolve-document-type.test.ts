import assert from "node:assert/strict";
import { test } from "node:test";
import type { DocumentTypeId, DocumentTypeView } from "@denser/contracts";
import { resolveDocumentTypeFromCatalog } from "./resolve-document-type.ts";

const issueId = "00000000-0000-4000-8000-000000000020" as DocumentTypeId;
const specId = "00000000-0000-4000-8000-000000000030" as DocumentTypeId;

const types: DocumentTypeView[] = [
  { id: issueId, name: "Issue", key: "issue", workflowId: null, properties: [] },
  { id: specId, name: "Spec", key: "spec", workflowId: null, properties: [] },
];

test("resolveDocumentTypeFromCatalog finds type by id", () => {
  const resolved = resolveDocumentTypeFromCatalog(
    { documentTypeId: specId, documentTypeKey: "spec" },
    types,
  );
  assert.equal(resolved?.key, "spec");
});

test("resolveDocumentTypeFromCatalog falls back to key when id is absent from catalog", () => {
  const foreignId = "00000000-0000-4000-8000-000000000099" as DocumentTypeId;
  const resolved = resolveDocumentTypeFromCatalog(
    { documentTypeId: foreignId, documentTypeKey: "spec" },
    types,
  );
  assert.equal(resolved?.key, "spec");
});

test("resolveDocumentTypeFromCatalog defaults to first type when document has no type", () => {
  const resolved = resolveDocumentTypeFromCatalog({}, types);
  assert.equal(resolved?.key, "issue");
});
