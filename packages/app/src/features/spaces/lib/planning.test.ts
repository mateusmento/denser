import assert from "node:assert/strict";
import { test } from "node:test";
import type { ArtifactSummary, SpaceSummary, WorkflowView } from "@denser/contracts";
import { backlogSections, boardColumns, thisSpaceChildSpaces } from "./planning.ts";

const now = "2026-01-01T00:00:00.000Z";
const acme = "00000000-0000-4000-8000-000000000010" as SpaceSummary["id"];
const engineering = "00000000-0000-4000-8000-000000000011" as SpaceSummary["id"];
const docId = "00000000-0000-4000-8000-000000000021" as ArtifactSummary["id"];
const alice = "00000000-0000-4000-8000-000000000001" as SpaceSummary["createdBy"];

function space(overrides: Partial<SpaceSummary> = {}): SpaceSummary {
  return {
    id: acme,
    title: "Acme",
    icon: "folder",
    parentSpaceId: null,
    rootSpaceId: acme,
    visibility: "public",
    createdBy: alice,
    showBacklog: false,
    showBoard: false,
    sprintingEnabled: false,
    sprintRole: null,
    sprintDurationWeeks: 2,
    activeSprintId: null,
    upcomingSprintId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function doc(overrides: Partial<ArtifactSummary> = {}): ArtifactSummary {
  return {
    id: docId,
    kind: "document",
    title: "Issue",
    spaceId: acme,
    rootSpaceId: acme,
    createdBy: alice,
    version: 1,
    createdAt: now,
    updatedAt: now,
    rank: 0,
    ...overrides,
  };
}

test("backlog without sprinting is one list", () => {
  const sections = backlogSections({
    space: space({ showBacklog: true }),
    artifacts: [doc()],
    childSpaces: [],
  });
  assert.equal(sections.length, 1);
  assert.equal(sections[0]?.key, "unscheduled");
  assert.equal(sections[0]?.documents.length, 1);
});

test("backlog with sprinting adds active and upcoming above unscheduled", () => {
  const upcoming = space({
    id: engineering,
    title: "Sprint 1",
    parentSpaceId: acme,
    sprintRole: "upcoming",
  });
  const sections = backlogSections({
    space: space({
      showBacklog: true,
      sprintingEnabled: true,
      upcomingSprintId: upcoming.id,
    }),
    artifacts: [
      doc(),
      doc({
        id: "00000000-0000-4000-8000-000000000022" as ArtifactSummary["id"],
        spaceId: upcoming.id,
        title: "Planned",
      }),
    ],
    childSpaces: [upcoming],
  });
  assert.deepEqual(
    sections.map((section) => section.key),
    ["upcoming", "unscheduled"],
  );
  assert.equal(sections[0]?.title, "Upcoming");
  assert.equal(sections[0]?.subtitle, "Sprint 1");
  assert.equal(sections[0]?.documents[0]?.title, "Planned");
});

test("this space gallery includes active and upcoming sprint children", () => {
  const visible = thisSpaceChildSpaces([
    space({ id: engineering, sprintRole: "upcoming", title: "Sprint 1" }),
    space({
      id: "00000000-0000-4000-8000-000000000012" as SpaceSummary["id"],
      sprintRole: "past",
      title: "Sprint 0",
    }),
  ]);
  assert.equal(visible.length, 2);
});

test("scrum board is empty until there is an active sprint", () => {
  const workflow: WorkflowView = {
    id: "00000000-0000-4000-8000-000000000030" as WorkflowView["id"],
    name: "Issue tracking",
    spaceId: acme,
    stages: [
      {
        id: "00000000-0000-4000-8000-000000000031" as WorkflowView["stages"][number]["id"],
        name: "Todo",
        kind: "idle",
        sort: 0,
        allowedSourceStageIds: [],
      },
    ],
  };
  const columns = boardColumns({
    space: space({ showBoard: true, sprintingEnabled: true }),
    workflow,
    artifacts: [doc({ stageId: workflow.stages[0]!.id })],
  });
  assert.equal(columns[0]?.documents.length, 0);
});
