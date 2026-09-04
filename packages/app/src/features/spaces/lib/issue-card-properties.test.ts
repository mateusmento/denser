import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactSummary, PropertyDefinition, SpaceMember, UserId } from "@denser/contracts";
import { projectIssueCardView } from "./issue-card-properties.ts";

const now = "2026-01-01T00:00:00.000Z";
const alice = "00000000-0000-4000-8000-000000000001" as UserId;
const docId = "00000000-0000-4000-8000-000000000021" as ArtifactSummary["id"];

const issuePropertiesSchema: PropertyDefinition[] = [
  {
    id: "prop-priority" as PropertyDefinition["id"],
    key: "priority",
    name: "Priority",
    type: "select",
    required: false,
    options: [
      { id: "urgent", name: "Urgent", color: "#ef4444" },
      { id: "high", name: "High", color: "#f97316" },
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
    options: [{ id: "frontend", name: "Frontend", color: "#3b82f6" }],
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

const members: SpaceMember[] = [
  {
    userId: alice,
    name: "Alice Chen",
    username: "alice",
    role: "owner",
    createdAt: now,
  },
];

function issueDocument(overrides: Partial<ArtifactSummary> = {}): ArtifactSummary {
  return {
    id: docId,
    kind: "document",
    title: "Fix login",
    spaceId: null,
    rootSpaceId: null,
    createdBy: alice,
    version: 1,
    createdAt: now,
    updatedAt: now,
    documentTypeKey: "issue",
    stageName: "In progress",
    properties: {
      priority: "High",
      assignee: alice,
      labels: ["Frontend"],
      estimate: 3,
      due_date: "2026-03-15",
    },
    ...overrides,
  };
}

test("projectIssueCardView resolves slots by semanticRole", () => {
  const view = projectIssueCardView(issueDocument(), issuePropertiesSchema, members, {
    variant: "backlog",
  });

  assert.equal(view.priority?.label, "High");
  assert.equal(view.assignee?.label, "Alice Chen");
  assert.equal(view.estimate, 3);
  assert.equal(view.labels.length, 1);
  assert.equal(view.labels[0]?.name, "Frontend");
  assert.ok(view.dueDate);
  assert.equal(view.stage, "In progress");
});

test("projectIssueCardView hides stage on board variant", () => {
  const view = projectIssueCardView(issueDocument(), issuePropertiesSchema, members, {
    variant: "board",
  });
  assert.equal(view.stage, null);
});

test("projectIssueCardView ignores properties without semanticRole", () => {
  const schema = [
    ...issuePropertiesSchema,
    {
      id: "prop-custom" as (typeof issuePropertiesSchema)[number]["id"],
      key: "custom_note",
      name: "Note",
      type: "text" as const,
      required: false,
      order: 99,
    },
  ];
  const view = projectIssueCardView(
    issueDocument({ properties: { ...issueDocument().properties, custom_note: "hello" } }),
    schema,
    members,
    { variant: "backlog" },
  );
  assert.equal(view.priority?.label, "High");
});

test("projectIssueCardView does not match renamed keys without semanticRole", () => {
  const schema = issuePropertiesSchema.map((prop) =>
    prop.semanticRole === "priority" ? { ...prop, key: "urgency", semanticRole: undefined } : prop,
  );
  const view = projectIssueCardView(
    issueDocument({ properties: { priority: "High" } }),
    schema,
    members,
    { variant: "backlog" },
  );
  assert.equal(view.priority, null);
});
