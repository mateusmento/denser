import type { ArtifactSummary, SpaceId, SpaceSummary, WorkflowView } from "@denser/contracts";

export type SpaceViewQuery = "backlog" | "board";

export function parseSpaceViewQuery(value: unknown): SpaceViewQuery | undefined {
  if (value === "backlog" || value === "board") return value;
  return undefined;
}

export type BacklogSectionKey = "active" | "upcoming" | "unscheduled";

export type BacklogSection = {
  key: BacklogSectionKey;
  title: string;
  subtitle?: string;
  spaceId: SpaceId;
  documents: ArtifactSummary[];
};

export function thisSpaceChildSpaces(childSpaces: readonly SpaceSummary[]): SpaceSummary[] {
  return childSpaces.slice();
}

export function thisSpaceArtifacts(
  spaceId: SpaceId,
  artifacts: readonly ArtifactSummary[],
): ArtifactSummary[] {
  return artifacts.filter((artifact) => artifact.spaceId === spaceId);
}

function documentsInSpace(
  spaceId: SpaceId,
  artifacts: readonly ArtifactSummary[],
): ArtifactSummary[] {
  return artifacts
    .filter((artifact) => artifact.kind === "document" && artifact.spaceId === spaceId)
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.title.localeCompare(b.title));
}

export function backlogSections(input: {
  space: SpaceSummary;
  artifacts: readonly ArtifactSummary[];
  childSpaces: readonly SpaceSummary[];
}): BacklogSection[] {
  const unscheduled: BacklogSection = {
    key: "unscheduled",
    title: "This space",
    spaceId: input.space.id,
    documents: documentsInSpace(input.space.id, input.artifacts),
  };

  if (!input.space.sprintingEnabled) {
    return [
      {
        ...unscheduled,
        title: "Backlog",
      },
    ];
  }

  const sections: BacklogSection[] = [];
  const active = input.childSpaces.find((child) => child.id === input.space.activeSprintId);
  if (active) {
    sections.push({
      key: "active",
      title: "Active",
      subtitle: active.title,
      spaceId: active.id,
      documents: documentsInSpace(active.id, input.artifacts),
    });
  }

  const upcoming = input.childSpaces.find((child) => child.id === input.space.upcomingSprintId);
  if (upcoming) {
    sections.push({
      key: "upcoming",
      title: "Upcoming",
      subtitle: upcoming.title,
      spaceId: upcoming.id,
      documents: documentsInSpace(upcoming.id, input.artifacts),
    });
  }

  sections.push(unscheduled);
  return sections;
}

export type BoardColumn = {
  stageId: string;
  name: string;
  kind: string;
  documents: ArtifactSummary[];
};

export function boardScopeSpaceId(space: SpaceSummary): SpaceId | null {
  if (space.sprintingEnabled) return space.activeSprintId;
  return space.id;
}

export function boardColumns(input: {
  space: SpaceSummary;
  workflow: WorkflowView | null;
  artifacts: readonly ArtifactSummary[];
}): BoardColumn[] {
  if (!input.workflow) return [];
  const scopeId = boardScopeSpaceId(input.space);
  const cards =
    scopeId == null
      ? []
      : input.artifacts.filter(
          (artifact) =>
            artifact.kind === "document" &&
            artifact.spaceId === scopeId &&
            artifact.stageId != null,
        );

  return input.workflow.stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    kind: stage.kind,
    documents: cards
      .filter((artifact) => artifact.stageId === stage.id)
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.title.localeCompare(b.title)),
  }));
}
