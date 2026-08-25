export type WorkspaceNavSpaceAction = "open" | "rename" | "openSettings" | "delete";

export type WorkspaceNavDocumentAction = "open" | "rename" | "duplicate" | "delete";

export type WorkspaceNavLink = {
  id: string;
  label: string;
  to: {
    name: "home" | "space" | "document";
    params?: { spaceId?: string; documentId?: string };
  };
  isActive: boolean;
};

export type WorkspaceNavContext = {
  title: string;
  spaces: readonly WorkspaceNavLink[];
  documents: readonly WorkspaceNavLink[];
};

export type WorkspaceNavView = {
  state: "loading" | "ready" | "error";
  errorMessage?: string;
  rootSpaces: readonly WorkspaceNavLink[];
  rootDocuments: readonly WorkspaceNavLink[];
  context?: WorkspaceNavContext;
};
