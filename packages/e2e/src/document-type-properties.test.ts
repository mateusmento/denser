import {
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_ARTIFACT_USER_RESEARCH,
  type ArtifactId,
} from "@denser/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHarness, type E2eHarness } from "./harness.js";

/** Seeded Core Platform backlog spec: PRD: Granular Permission Matrices */
const SEED_SPEC_DOCUMENT_ID = "00000000-0000-4000-8000-004000000003" as ArtifactId;

function textProperty(name: string, order: number) {
  return {
    id: crypto.randomUUID(),
    key: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    name,
    type: "text" as const,
    required: false,
    order,
  };
}

describe("document type properties", () => {
  let harness: E2eHarness;

  beforeAll(async () => {
    harness = await startHarness();
  }, 120_000);

  afterAll(async () => {
    await harness.stop();
  });

  it("returns documentType from getDocument for a seeded spec", async () => {
    const client = await harness.createAuthedClient("alice");
    const response = await client.getDocument(SEED_SPEC_DOCUMENT_ID);

    expect(response.document.documentTypeKey).toBe("spec");
    expect(response.documentType?.key).toBe("spec");
    expect(response.documentType?.properties.length).toBeGreaterThan(0);
  });

  it("adds a text property to the spec document type", async () => {
    const client = await harness.createAuthedClient("alice");
    const loaded = await client.getDocument(SEED_SPEC_DOCUMENT_ID);
    const specType = loaded.documentType;
    expect(specType).toBeTruthy();

    const propertyName = `Acceptance criteria ${Date.now()}`;
    const updated = await client.patchDocumentType(specType!.id, {
      properties: [...specType!.properties, textProperty(propertyName, specType!.properties.length)],
    });

    expect(updated.documentType.properties.some((prop) => prop.name === propertyName)).toBe(true);

    const reloaded = await client.getDocument(SEED_SPEC_DOCUMENT_ID);
    expect(
      reloaded.documentType?.properties.some((prop) => prop.name === propertyName),
    ).toBe(true);
  });

  it("adds a text property to the doc document type", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space } = await client.createSpace({ title: "Docs workspace", preset: "project" });
    const detail = await client.getSpace(space.id);
    const docType = detail.documentTypes.find((type) => type.key === "doc");
    expect(docType).toBeTruthy();

    const { document } = await client.createDocument({
      title: "Architecture overview",
      spaceId: space.id,
      documentTypeKey: "doc",
    });
    const loaded = await client.getDocument(document.id);

    expect(loaded.document.documentTypeKey).toBe("doc");
    expect(loaded.documentType?.key).toBe("doc");

    const propertyName = `Summary ${Date.now()}`;
    const patched = await client.patchDocumentType(docType!.id, {
      properties: [...docType!.properties, textProperty(propertyName, docType!.properties.length)],
    });
    expect(patched.documentType.properties.some((prop) => prop.name === propertyName)).toBe(true);

    const reloaded = await client.getDocument(document.id);
    expect(
      reloaded.documentType?.properties.some((prop) => prop.name === propertyName),
    ).toBe(true);
  });

  it("inherits planning document types for nested project folders", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space: project } = await client.createSpace({ title: "Nested props", preset: "project" });
    const { space: folder } = await client.createSpace({
      title: "Specs",
      parentSpaceId: project.id,
    });

    const detail = await client.getSpace(folder.id);
    expect(detail.documentTypes.map((type) => type.key).sort()).toEqual(["doc", "issue", "spec"]);
  });

  it("auto-assigns a home Doc type for spaceless artifacts", async () => {
    const client = await harness.createAuthedClient("alice");
    const response = await client.getDocument(SEED_ARTIFACT_PERSONAL_NOTES);

    expect(response.document.title).toBe("Personal notes");
    expect(response.document.spaceId).toBeNull();
    expect(response.document.documentTypeKey).toBe("doc");
    expect(response.documentType?.key).toBe("doc");

    const propertyName = `Scratchpad tag ${Date.now()}`;
    const patched = await client.patchDocumentType(response.documentType!.id, {
      properties: [
        ...response.documentType!.properties,
        textProperty(propertyName, response.documentType!.properties.length),
      ],
    });
    expect(patched.documentType.properties.some((prop) => prop.name === propertyName)).toBe(true);
  });

  it("auto-assigns a Doc type for folder workspace documents", async () => {
    const client = await harness.createAuthedClient("alice");
    const loaded = await client.getDocument(SEED_ARTIFACT_USER_RESEARCH);

    expect(loaded.document.spaceId).toBeTruthy();
    expect(loaded.document.documentTypeKey).toBe("doc");
    expect(loaded.documentType?.key).toBe("doc");

    const propertyName = `Research theme ${Date.now()}`;
    const patched = await client.patchDocumentType(loaded.documentType!.id, {
      properties: [
        ...loaded.documentType!.properties,
        textProperty(propertyName, loaded.documentType!.properties.length),
      ],
    });
    expect(patched.documentType.properties.some((prop) => prop.name === propertyName)).toBe(true);
  });

  it("resolves documentType for a spec created in a nested folder", async () => {
    const client = await harness.createAuthedClient("alice");
    const { space: project } = await client.createSpace({ title: "Nested specs", preset: "project" });
    const { space: folder } = await client.createSpace({
      title: "RFCs",
      parentSpaceId: project.id,
    });

    const { document } = await client.createDocument({
      title: "Auth RFC",
      spaceId: folder.id,
      documentTypeKey: "spec",
    });

    const loaded = await client.getDocument(document.id);
    expect(loaded.document.documentTypeKey).toBe("spec");
    expect(loaded.documentType?.key).toBe("spec");

    const propertyName = `Open questions ${Date.now()}`;
    const patched = await client.patchDocumentType(loaded.documentType!.id, {
      properties: [
        ...loaded.documentType!.properties,
        textProperty(propertyName, loaded.documentType!.properties.length),
      ],
    });
    expect(patched.documentType.properties.some((prop) => prop.name === propertyName)).toBe(true);
  });
});
