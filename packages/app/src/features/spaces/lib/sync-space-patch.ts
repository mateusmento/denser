import type { SpaceSummary } from "@denser/contracts";
import type { QueryClient } from "@tanstack/vue-query";
import { spacesCollection, upsertInCollection } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";

/** Apply a space patch to the canonical TanStack DB replica. Projections follow via live queries. */
export function applySpacePatch(space: SpaceSummary) {
  upsertInCollection(spacesCollection, space);
}

export function spaceProjectionQueryKeys(space: Pick<SpaceSummary, "id" | "parentSpaceId">) {
  const keys = [queryKeys.home(), queryKeys.space(space.id)];
  if (space.parentSpaceId) keys.push(queryKeys.space(space.parentSpaceId));
  return keys;
}

export async function invalidateSpaceProjections(
  queryClient: QueryClient,
  space: Pick<SpaceSummary, "id" | "parentSpaceId">,
) {
  await Promise.all(
    spaceProjectionQueryKeys(space).map((key) => queryClient.invalidateQueries({ queryKey: key })),
  );
}
