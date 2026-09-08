import type { SidebarSectionItemLimit } from "@denser/contracts";
import type { SpaceIcon } from "@denser/contracts";

export type WorkspaceNavSpaceAction =
  | "open"
  | "rename"
  | "openSettings"
  | "delete"
  | "pin"
  | "unpin";

export type WorkspaceNavArtifactAction = "open" | "rename" | "duplicate" | "delete" | "hide";

export type WorkspaceNavArtifactKind = "document" | "conversation";

export type WorkspaceNavLink = {
  id: string;
  label: string;
  icon?: SpaceIcon | null;
  artifactKind?: WorkspaceNavArtifactKind;
  /** 1:1 DM peer — used for workspace-presence dot (group DMs omit). */
  peerUserId?: string;
  peerOnline?: boolean;
  unreadCount?: number;
  to: {
    name:
      | "home"
      | "space"
      | "document"
      | "conversation"
      | "workspace-drafts"
      | "workspace-scheduled";
    params?: { spaceId?: string; documentId?: string; conversationId?: string };
  };
  isActive: boolean;
};

export type WorkspaceNavSectionItemLimit = SidebarSectionItemLimit;

export const WORKSPACE_NAV_SECTION_ITEM_LIMITS: readonly WorkspaceNavSectionItemLimit[] = [
  5, 7, 15, 30, 50,
];

export type WorkspaceNavSection = {
  label: string;
  items: readonly WorkspaceNavLink[];
  sectionSpaceId: string;
  isPinned?: boolean;
  itemLimit: WorkspaceNavSectionItemLimit;
  overflowItems?: readonly WorkspaceNavLink[];
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
  pinnedSections?: readonly WorkspaceNavSection[];
  directMessagesSection?: WorkspaceNavSection;
  outboxSection?: WorkspaceNavSection;
  activeRootSpaceId?: string | null;
};

/** @deprecated Use WorkspaceNavArtifactAction */
export type WorkspaceNavDocumentAction = WorkspaceNavArtifactAction;
