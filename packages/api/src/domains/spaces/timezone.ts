import type { SpaceId } from "@denser/contracts";
import { findSpaceById, type SpaceRow } from "./repository.js";

export class ScheduleTimezoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleTimezoneError";
  }
}

export function resolveScheduleTimezoneFromRows(
  startSpaceId: SpaceId,
  load: (spaceId: SpaceId) => SpaceRow | undefined,
): { timezone: string; privateSpaceId: SpaceId } {
  let currentId: SpaceId | null = startSpaceId;

  while (currentId) {
    const row = load(currentId);
    if (!row) {
      throw new ScheduleTimezoneError(`Space not found: ${currentId}`);
    }
    if (row.visibility === "private") {
      if (!row.timezone) {
        throw new ScheduleTimezoneError(`Private space missing timezone: ${currentId}`);
      }
      return { timezone: row.timezone, privateSpaceId: row.id };
    }
    currentId = row.parentSpaceId;
  }

  throw new ScheduleTimezoneError(`No private space in ancestry for ${startSpaceId}`);
}

export async function resolveScheduleTimezoneAsync(
  spaceId: SpaceId,
): Promise<{ timezone: string; privateSpaceId: SpaceId }> {
  let currentId: SpaceId | null = spaceId;

  while (currentId) {
    const row = await findSpaceById(currentId);
    if (!row) {
      throw new ScheduleTimezoneError(`Space not found: ${currentId}`);
    }
    if (row.visibility === "private") {
      if (!row.timezone) {
        throw new ScheduleTimezoneError(`Private space missing timezone: ${currentId}`);
      }
      return { timezone: row.timezone, privateSpaceId: row.id };
    }
    currentId = row.parentSpaceId;
  }

  throw new ScheduleTimezoneError(`No private space in ancestry for ${spaceId}`);
}

export async function initialTimezoneForNewPrivateSpace(input: {
  parentSpaceId: SpaceId | null;
  ownerUserTimezone: string | null;
}): Promise<string> {
  if (input.parentSpaceId) {
    const resolved = await resolveScheduleTimezoneAsync(input.parentSpaceId);
    return resolved.timezone;
  }
  return input.ownerUserTimezone?.trim() || "UTC";
}
