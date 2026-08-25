import type { CreateSpaceInput, SpaceId, UserId } from "@denser/contracts";
import { getAccessibleRootSpaceIds, requireSpaceAccess } from "../tenancy/access.js";
import { toSpaceSummary } from "./mapper.js";
import {
  insertNestedSpace,
  insertOwnerMembership,
  insertRootSpace,
  listChildSpaces,
  listRootSpacesByIds,
  type SpaceRow,
} from "./repository.js";
import * as artifactRepository from "../artifacts/repository.js";
import { toArtifactSummary } from "../artifacts/mapper.js";

export async function createSpace(userId: UserId, input: CreateSpaceInput) {
  if (input.parentSpaceId) {
    const parent = await requireSpaceAccess(userId, input.parentSpaceId);
    if (!parent) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const created = await insertNestedSpace({
      title: input.title,
      parentSpaceId: parent.id,
      rootSpaceId: parent.rootSpaceId ?? parent.id,
      createdBy: userId,
    });

    return { ok: true as const, space: toSpaceSummary(created) };
  }

  const created = await insertRootSpace({ title: input.title, createdBy: userId });
  await insertOwnerMembership({ spaceId: created.id, userId });

  return { ok: true as const, space: toSpaceSummary(created) };
}

export async function getSpaceDetail(userId: UserId, spaceId: SpaceId) {
  const row = await requireSpaceAccess(userId, spaceId);
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const childSpaces = await listChildSpaces(spaceId);
  const artifacts = await artifactRepository.listArtifactsInSpace(spaceId);

  return {
    ok: true as const,
    space: toSpaceSummary(row),
    childSpaces: childSpaces.map(toSpaceSummary),
    artifacts: artifacts.map(toArtifactSummary),
  };
}

export async function listHomeRootSpaces(userId: UserId) {
  const rootSpaceIds = await getAccessibleRootSpaceIds(userId);
  const rows = await listRootSpacesByIds(rootSpaceIds);
  return rows.map(toSpaceSummary);
}

export function resolveTenantRootSpaceId(row: SpaceRow): SpaceId {
  return row.rootSpaceId ?? row.id;
}
