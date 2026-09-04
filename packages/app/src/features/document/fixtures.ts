import type { ArtifactId, ArtifactSummary, PropertyDefinition, SpaceId, SpaceMember, UserId } from "@denser/contracts";
import { emptyDoc, featureTourDoc, type MentionCandidate } from "@/modules/rich-text";
import type { SpaceMoveNode } from "@/modules/spaces/lib/space-move-menu";
import type { DocumentDraftView, DocumentSurfaceView, RelationDocumentsEntry } from "./types";

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

export const issuePropertiesSchema: PropertyDefinition[] = [
  {
    id: "prop-priority" as PropertyDefinition["id"],
    key: "priority",
    name: "Priority",
    type: "select",
    required: false,
    options: [
      { id: "urgent", name: "Urgent", color: "#ef4444" },
      { id: "high", name: "High", color: "#f97316" },
      { id: "medium", name: "Medium", color: "#eab308" },
      { id: "low", name: "Low", color: "#3b82f6" },
    ],
    order: 0,
    semanticRole: "priority",
  },
  {
    id: "prop-assignee" as PropertyDefinition["id"],
    key: "assignee",
    name: "Assignee",
    type: "person",
    required: false,
    allowMultiple: false,
    order: 1,
    semanticRole: "assignee",
  },
  {
    id: "prop-labels" as PropertyDefinition["id"],
    key: "labels",
    name: "Labels",
    type: "multi_select",
    required: false,
    options: [
      { id: "frontend", name: "Frontend", color: "#8b5cf6" },
      { id: "backend", name: "Backend", color: "#06b6d4" },
      { id: "design", name: "Design", color: "#ec4899" },
      { id: "bug", name: "Bug", color: "#ef4444" },
    ],
    order: 2,
    semanticRole: "labels",
  },
  {
    id: "prop-estimate" as PropertyDefinition["id"],
    key: "estimate",
    name: "Estimate",
    type: "number",
    required: false,
    order: 3,
    semanticRole: "estimate",
  },
  {
    id: "prop-due-date" as PropertyDefinition["id"],
    key: "due_date",
    name: "Due date",
    type: "date",
    required: false,
    dateFormat: "full_date",
    timeFormat: "hidden",
    notification: { preset: "none" },
    order: 4,
    semanticRole: "due_date",
  },
];

export const samplePropertyValues: Record<string, unknown> = {
  priority: "High",
  assignee: "u-ava" as UserId,
  labels: ["Frontend", "Design"],
  estimate: 3,
};

export const readyDocumentView: DocumentSurfaceView = {
  state: "ready",
  canEdit: true,
  header: { title: "Onboarding notes", spaceLabel: "Acme" },
  titlePlaceholder: "Untitled",
  bodyPlaceholder: "Start writing…",
  mentionItems: [],
  propertiesSchema: issuePropertiesSchema,
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
  properties: {},
};

export const seededDraft: DocumentDraftView = {
  title: "Onboarding notes",
  body: featureTourDoc,
  properties: samplePropertyValues,
};

export const spaceMembersFixture: SpaceMember[] = [
  {
    userId: "u-ava" as SpaceMember["userId"],
    username: "ava",
    name: "Ava Chen",
    role: "member",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    userId: "u-jon" as SpaceMember["userId"],
    username: "jon",
    name: "Jon Park",
    role: "member",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

export const fixtureEngSpaceId = "eng" as SpaceId;
export const fixtureAcmeSpaceId = "acme" as SpaceId;
export const fixtureDesignSpaceId = "design" as SpaceId;

export const relationSpacesFixture: SpaceMoveNode[] = [
  { id: fixtureAcmeSpaceId, title: "Acme", parentId: null },
  { id: fixtureEngSpaceId, title: "Engineering", parentId: fixtureAcmeSpaceId },
  { id: fixtureDesignSpaceId, title: "Design", parentId: fixtureAcmeSpaceId },
];

export const relationDocumentsFixture: Partial<Record<SpaceId, ArtifactSummary[]>> = {
  [fixtureEngSpaceId]: [
    {
      id: "doc-1" as ArtifactId,
      kind: "document",
      title: "Auth spec",
      spaceId: fixtureEngSpaceId,
    },
    {
      id: "doc-2" as ArtifactId,
      kind: "document",
      title: "Dashboard polish",
      spaceId: fixtureEngSpaceId,
    },
  ] as ArtifactSummary[],
};

export const relationDocumentsBySpaceIdFixture: Partial<Record<SpaceId, RelationDocumentsEntry>> = {
  [fixtureEngSpaceId]: {
    loading: false,
    items: relationDocumentsFixture[fixtureEngSpaceId] ?? [],
  },
};
