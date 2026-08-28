import type { SpaceIcon } from "@denser/contracts";

export type WorkspaceNavSpaceAction = "open" | "rename" | "openSettings" | "delete";

export type WorkspaceNavArtifactAction = "open" | "rename" | "duplicate" | "delete";

export type WorkspaceNavArtifactKind = "document" | "conversation";

export type WorkspaceNavLink = {
  id: string;
  label: string;
  icon?: SpaceIcon | null;
  artifactKind?: WorkspaceNavArtifactKind;
  to: {
    name: "home" | "space" | "document" | "conversation";
    params?: { spaceId?: string; documentId?: string; conversationId?: string };
  };
  isActive: boolean;
};

export type WorkspaceNavSection = {
  label: string;
  items: readonly WorkspaceNavLink[];
  scopeSpaceId?: string | null;
};

export type WorkspaceNavView = {
  state: "loading" | "ready" | "error";
  errorMessage?: string;
  homeSection: WorkspaceNavSection;
  inSpaceSection?: WorkspaceNavSection;
  directMessagesSection?: WorkspaceNavSection;
  activeRootSpaceId?: string | null;
};

/** @deprecated Use WorkspaceNavArtifactAction */
export type WorkspaceNavDocumentAction = WorkspaceNavArtifactAction;
