import type { SpaceIcon } from "@denser/contracts";

export type WorkspaceNavSpaceAction = "open" | "rename" | "openSettings" | "delete";

export type WorkspaceNavArtifactAction = "open" | "rename" | "duplicate" | "delete";

export type WorkspaceNavArtifactKind = "document" | "conversation";

export type WorkspaceNavLink = {
  id: string;
  label: string;
  icon?: SpaceIcon | null;
  artifactKind?: WorkspaceNavArtifactKind;
  /** 1:1 DM peer — used for workspace-presence dot (group DMs omit). */
  peerUserId?: string;
  peerOnline?: boolean;
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
  /** Shown when items exceed the in-space sidebar limit — opens the space gallery. */
  seeAllLink?: WorkspaceNavLink;
};

export type WorkspaceNavHomeButton = {
  label: string;
  showBackHint: boolean;
};

export type WorkspaceNavView = {
  state: "loading" | "ready" | "error";
  errorMessage?: string;
  homeButton: WorkspaceNavHomeButton;
  homeSection?: WorkspaceNavSection;
  inSpaceSection?: WorkspaceNavSection;
  directMessagesSection?: WorkspaceNavSection;
  activeRootSpaceId?: string | null;
};

/** @deprecated Use WorkspaceNavArtifactAction */
export type WorkspaceNavDocumentAction = WorkspaceNavArtifactAction;
