import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactId } from "@denser/contracts";
import { readDocumentFromQueryData } from "./document-query.ts";

const docId = "00000000-0000-4000-8000-000000000020" as ArtifactId;

test("readDocumentFromQueryData reads wrapped query data", () => {
  const document = {
    id: docId,
    kind: "document" as const,
    title: "Notes",
    body: { type: "doc", content: [] },
    spaceId: null,
    rootSpaceId: null,
    createdBy: docId,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  assert.equal(
    readDocumentFromQueryData({ document, documentType: null })?.title,
    "Notes",
  );
});

test("readDocumentFromQueryData reads legacy bare document cache entries", () => {
  const document = {
    id: docId,
    kind: "document" as const,
    title: "Legacy",
    body: { type: "doc", content: [] },
    spaceId: null,
    rootSpaceId: null,
    createdBy: docId,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  assert.equal(readDocumentFromQueryData(document)?.title, "Legacy");
});
