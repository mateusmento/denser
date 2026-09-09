import { describe, expect, it } from "vitest";
import {
  privateWorkspaceRootsFromHome,
  resolvePrivateWorkspaceRootId,
} from "./resolve-private-workspace-root";

const acme = {
  id: "space-acme",
  parentSpaceId: null,
  visibility: "private" as const,
};

const engineering = {
  id: "space-eng",
  parentSpaceId: null,
  visibility: "public" as const,
};

const nested = {
  id: "space-nested",
  parentSpaceId: "space-acme",
  visibility: "private" as const,
};

describe("privateWorkspaceRootsFromHome", () => {
  it("returns only top-level private workspaces", () => {
    expect(privateWorkspaceRootsFromHome([acme, engineering, nested])).toEqual(["space-acme"]);
  });
});

describe("resolvePrivateWorkspaceRootId", () => {
  it("returns the sole private root", () => {
    expect(resolvePrivateWorkspaceRootId([acme, engineering])).toBe("space-acme");
  });

  it("prefers a valid preferred root when multiple private roots exist", () => {
    const otherPrivate = {
      id: "space-other",
      parentSpaceId: null,
      visibility: "private" as const,
    };
    expect(resolvePrivateWorkspaceRootId([acme, otherPrivate], "space-other")).toBe("space-other");
  });

  it("returns null when multiple private roots exist without a preference", () => {
    const otherPrivate = {
      id: "space-other",
      parentSpaceId: null,
      visibility: "private" as const,
    };
    expect(resolvePrivateWorkspaceRootId([acme, otherPrivate])).toBeNull();
  });
});
