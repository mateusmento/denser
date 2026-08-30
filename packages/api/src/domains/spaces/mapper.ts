import {
  SpaceIcon,
  DEFAULT_SPACE_ICON,
  type SpaceMember,
  type SpaceSummary,
  type SprintDurationWeeks,
} from "@denser/contracts";
import type { space } from "../../db/schema/space.js";
import type { SpaceMemberRow } from "./membership-repository.js";

function toIso(value: Date): string {
  return value.toISOString();
}

function toSpaceIcon(value: string | null | undefined): SpaceIcon {
  const parsed = SpaceIcon.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_SPACE_ICON;
}

function toSprintDurationWeeks(value: number): SprintDurationWeeks {
  if (value === 1 || value === 4) return value;
  return 2;
}

export function toSpaceSummary(row: typeof space.$inferSelect): SpaceSummary {
  return {
    id: row.id,
    title: row.title,
    icon: toSpaceIcon(row.icon),
    parentSpaceId: row.parentSpaceId,
    rootSpaceId: row.rootSpaceId,
    visibility: row.visibility,
    createdBy: row.createdBy,
    showBacklog: row.showBacklog,
    showBoard: row.showBoard,
    sprintingEnabled: row.sprintingEnabled,
    sprintRole: row.sprintRole,
    sprintDurationWeeks: toSprintDurationWeeks(row.sprintDurationWeeks),
    activeSprintId: row.activeSprintId,
    upcomingSprintId: row.upcomingSprintId,
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
