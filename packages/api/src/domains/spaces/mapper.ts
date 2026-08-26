import { SpaceIcon, type SpaceMember, type SpaceSummary } from "@denser/contracts";
import type { space } from "../../db/schema/space.js";
import type { SpaceMemberRow } from "./membership-repository.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export function toSpaceSummary(row: typeof space.$inferSelect): SpaceSummary {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon ? (SpaceIcon.safeParse(row.icon).success ? (row.icon as SpaceIcon) : null) : null,
    parentSpaceId: row.parentSpaceId,
    rootSpaceId: row.rootSpaceId,
    visibility: row.visibility,
    createdBy: row.createdBy,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toSpaceMember(row: SpaceMemberRow): SpaceMember {
  return {
    userId: row.userId,
    name: row.name,
    username: row.username,
    role: row.role,
    createdAt: row.createdAt,
  };
}
