import type { SpaceId, SpaceSummary } from "@denser/contracts";
import { eq, inArray, useLiveQuery } from "@tanstack/vue-db";
import { computed } from "vue";
import { spacesCollection } from "@/lib/db";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";

/** Keep query-window order while reading fresh entity fields from TanStack DB. */
export function resolveSpacesInOrder(
  window: readonly SpaceSummary[],
  live: readonly SpaceSummary[] | undefined,
): SpaceSummary[] {
  if (!live?.length) return [...window];
  const byId = new Map(live.map((space) => [space.id, space]));
  return window.map((row) => byId.get(row.id) ?? row);
}

export function useLiveSpace(spaceId: ReadonlyRefOrGetter<SpaceId | undefined>) {
  const id = toReadonlyRef(spaceId);

  const query = useLiveQuery(
    (q) =>
      id.value
        ? q.from({ spaces: spacesCollection }).where(({ spaces }) => eq(spaces.id, id.value!))
        : undefined,
    [id],
  );

  return computed(() => query.data.value?.[0]);
}

export function useLiveSpacesInWindow(window: ReadonlyRefOrGetter<readonly SpaceSummary[]>) {
  const windowRef = toReadonlyRef(window);
  const ids = computed(() => windowRef.value.map((space) => space.id));

  const query = useLiveQuery(
    (q) => {
      const idList = ids.value;
      if (idList.length === 0) return undefined;
      return q.from({ spaces: spacesCollection }).where(({ spaces }) => inArray(spaces.id, idList));
    },
    [ids],
  );

  return computed(() => resolveSpacesInOrder(windowRef.value, query.data.value));
}
