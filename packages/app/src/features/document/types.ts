import type { JSONContent, MentionCandidate } from "@/modules/rich-text";

export type DocumentSurfaceState = "loading" | "ready" | "error" | "forbidden";

export type DocumentHeaderView = {
  title: string;
  spaceLabel?: string;
};

export type DocumentSurfaceView = {
  state: DocumentSurfaceState;
  canEdit: boolean;
  header: DocumentHeaderView;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  errorMessage?: string;
  mentionItems?: readonly MentionCandidate[];
};

export type DocumentDraftView = {
  title: string;
  body: JSONContent;
};
