import type { SpaceId } from "@denser/contracts";
import type { QueryClient } from "@tanstack/vue-query";
import { queryKeys } from "@/lib/query-keys";

export function invalidateWorkspaceDraftOutbox(
  queryClient: QueryClient,
  rootSpaceId?: SpaceId | null,
) {
  if (rootSpaceId) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDrafts(rootSpaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDraftCount(rootSpaceId) }),
    ]);
  }
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["workspaceDrafts"] }),
    queryClient.invalidateQueries({ queryKey: ["workspaceDraftCount"] }),
  ]);
}

export function invalidateWorkspaceScheduledOutbox(
  queryClient: QueryClient,
  rootSpaceId?: SpaceId | null,
) {
  if (rootSpaceId) {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceScheduledMessages(rootSpaceId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaceScheduledCount(rootSpaceId) }),
    ]);
  }
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["workspaceScheduledMessages"] }),
    queryClient.invalidateQueries({ queryKey: ["workspaceScheduledCount"] }),
  ]);
}
