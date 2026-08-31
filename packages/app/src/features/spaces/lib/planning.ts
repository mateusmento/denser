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

export type PlaceNeighbors = {
  afterId: string | null;
  beforeId: string | null;
};

export function neighborsOf(ids: readonly string[], movedId: string): PlaceNeighbors {
  const index = ids.indexOf(movedId);
  if (index < 0) return { afterId: null, beforeId: null };
  return { afterId: ids[index - 1] ?? null, beforeId: ids[index + 1] ?? null };
}

export function neighborsAfterSort(
  ids: readonly string[],
  movedId: string,
  overIndex: number,
): PlaceNeighbors {
  const rest = ids.filter((id) => id !== movedId);
  return { afterId: rest[overIndex - 1] ?? null, beforeId: rest[overIndex] ?? null };
}

export function samePlace(
  current: PlaceNeighbors,
  next: PlaceNeighbors,
): boolean {
  return current.afterId === next.afterId && current.beforeId === next.beforeId;
}

export function placeInDocuments<T extends { id: string }>(
  documents: readonly T[],
  item: T,
  neighbors: PlaceNeighbors,
): T[] {
  const rest = documents.filter((entry) => entry.id !== item.id);
  const afterIndex = neighbors.afterId
    ? rest.findIndex((entry) => entry.id === neighbors.afterId)
    : -1;
  const index =
    afterIndex >= 0
      ? afterIndex + 1
      : neighbors.beforeId
        ? Math.max(
            rest.findIndex((entry) => entry.id === neighbors.beforeId),
            0,
          )
        : rest.length;
  const next = [...rest];
  next.splice(index, 0, item);
  return next;
}

export function placeInBacklog(
  sections: readonly BacklogSection[],
  payload: { artifactId: string; toSpaceId: string } & PlaceNeighbors,
): BacklogSection[] {
  const from = sections.find((section) =>
    section.documents.some((document) => document.id === payload.artifactId),
  );
  const to = sections.find((section) => section.spaceId === payload.toSpaceId);
  const moved = from?.documents.find((document) => document.id === payload.artifactId);
  if (!from || !to || !moved) return sections.slice();
  const item = { ...moved, spaceId: payload.toSpaceId as typeof moved.spaceId };
  return sections.map((section) => {
    if (section.spaceId === to.spaceId) {
      return { ...section, documents: placeInDocuments(section.documents, item, payload) };
    }
    if (section.spaceId === from.spaceId) {
      return {
        ...section,
        documents: section.documents.filter((document) => document.id !== payload.artifactId),
      };
    }
    return section;
  });
}

export function placeInBoard(
  columns: readonly BoardColumn[],
  payload: { artifactId: string; stageId: string } & PlaceNeighbors,
): BoardColumn[] {
  const from = columns.find((column) =>
    column.documents.some((document) => document.id === payload.artifactId),
  );
  const to = columns.find((column) => column.stageId === payload.stageId);
  const moved = from?.documents.find((document) => document.id === payload.artifactId);
  if (!from || !to || !moved) return columns.slice();
  const item = { ...moved, stageId: payload.stageId as NonNullable<typeof moved.stageId> };
  return columns.map((column) => {
    if (column.stageId === to.stageId) {
      return { ...column, documents: placeInDocuments(column.documents, item, payload) };
    }
    if (column.stageId === from.stageId) {
      return {
        ...column,
        documents: column.documents.filter((document) => document.id !== payload.artifactId),
      };
    }
    return column;
  });
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
