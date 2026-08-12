import { emptyDoc, featureTourDoc, type MentionCandidate } from "@/modules/rich-text";
import type { DocumentDraftView, DocumentSurfaceView } from "./types";

export const mentionPeople: readonly MentionCandidate[] = [
  { id: "u-ava", label: "Ava Chen" },
  { id: "u-jon", label: "Jon Park" },
  { id: "u-mia", label: "Mia Rossi" },
];

export function documentMentionItems(query: string): MentionCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...mentionPeople];
  return mentionPeople.filter((person) => person.label.toLowerCase().includes(q));
}

export const readyDocumentView: DocumentSurfaceView = {
  state: "ready",
  canEdit: true,
  header: { title: "Onboarding notes", spaceLabel: "Acme" },
  titlePlaceholder: "Untitled",
  bodyPlaceholder: "Start writing…",
  mentionItems: [],
};

export const readOnlyDocumentView: DocumentSurfaceView = {
  ...readyDocumentView,
  canEdit: false,
};

export const loadingDocumentView: DocumentSurfaceView = {
  ...readyDocumentView,
  state: "loading",
};

export const errorDocumentView: DocumentSurfaceView = {
  ...readyDocumentView,
  state: "error",
  errorMessage: "Couldn’t load this document.",
};

export const forbiddenDocumentView: DocumentSurfaceView = {
  ...readyDocumentView,
  state: "forbidden",
  canEdit: false,
};

export const emptyDraft: DocumentDraftView = {
  title: "",
  body: emptyDoc(),
};

export const seededDraft: DocumentDraftView = {
  title: "Onboarding notes",
  body: featureTourDoc,
};
