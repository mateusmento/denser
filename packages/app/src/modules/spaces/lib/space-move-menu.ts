export const MOVE_HOME = "home";

export type SpaceMoveLocation = typeof MOVE_HOME | string;

export type SpaceMoveDestination = { kind: "home" } | { kind: "space"; spaceId: string };

export type SpaceMoveNode = {
  id: string;
  title: string;
  parentId: string | null;
};

export type SpaceMoveEntry = {
  id: string;
  title: string;
  location: SpaceMoveLocation;
};

export function destinationForLocation(location: SpaceMoveLocation): SpaceMoveDestination {
  if (location === MOVE_HOME) return { kind: "home" };
  return { kind: "space", spaceId: location };
}

export function titleForLocation(location: SpaceMoveLocation, spaces: readonly SpaceMoveNode[]): string {
  if (location === MOVE_HOME) return "Home";
  return spaces.find((space) => space.id === location)?.title ?? "Home";
}

export function parentLocation(location: SpaceMoveLocation, spaces: readonly SpaceMoveNode[]): SpaceMoveLocation {
  if (location === MOVE_HOME) return MOVE_HOME;
  const space = spaces.find((entry) => entry.id === location);
  return space?.parentId ?? MOVE_HOME;
}

export function childrenForLocation(
  spaces: readonly SpaceMoveNode[],
  location: SpaceMoveLocation,
  blockedIds: ReadonlySet<string> = new Set(),
): SpaceMoveEntry[] {
  const parentId = location === MOVE_HOME ? null : location;
  return spaces
    .filter((space) => space.parentId === parentId && !blockedIds.has(space.id))
    .map((space) => ({ id: space.id, title: space.title, location: space.id }));
}

export function matchesSearch(title: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return title.toLowerCase().includes(needle);
}
