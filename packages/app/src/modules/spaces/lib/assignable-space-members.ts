import type { SpaceDetailResponse, SpaceId, SpaceMember } from "@denser/contracts";
import { apiClient } from "@/lib/api";

function rosterFromDetail(detail: SpaceDetailResponse): SpaceMember[] {
  if (detail.assignableMembers?.length) return detail.assignableMembers;
  if (detail.members.length) return detail.members;
  return [];
}

/** Resolves person-property assignees, inheriting membership from ancestor spaces. */
export async function resolveAssignableSpaceMembers(
  detail: SpaceDetailResponse,
): Promise<SpaceMember[]> {
  const direct = rosterFromDetail(detail);
  if (direct.length) return direct;

  let parentId: SpaceId | null | undefined = detail.space.parentSpaceId;
  while (parentId) {
    const parent = await apiClient.getSpace(parentId);
    const roster = rosterFromDetail(parent);
    if (roster.length) return roster;
    parentId = parent.space.parentSpaceId;
  }

  return [];
}
