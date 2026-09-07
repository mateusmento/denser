import type { SpaceId, UserId } from "@denser/contracts";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  sidebarSectionPreference,
  spaceSidebarPin,
} from "../../db/schema/sidebar-pins.js";
import { space } from "../../db/schema/space.js";

export type SpaceSidebarPinRow = typeof spaceSidebarPin.$inferSelect;
export type SidebarSectionPreferenceRow = typeof sidebarSectionPreference.$inferSelect;

export async function listPinsForUser(
  userId: UserId,
  rootSpaceId: SpaceId,
): Promise<SpaceSidebarPinRow[]> {
  return db
    .select()
    .from(spaceSidebarPin)
    .where(and(eq(spaceSidebarPin.userId, userId), eq(spaceSidebarPin.rootSpaceId, rootSpaceId)))
    .orderBy(desc(spaceSidebarPin.pinnedAt));
}

export async function findPin(
  userId: UserId,
  rootSpaceId: SpaceId,
  spaceId: SpaceId,
): Promise<SpaceSidebarPinRow | undefined> {
  return db.query.spaceSidebarPin.findFirst({
    where: and(
      eq(spaceSidebarPin.userId, userId),
      eq(spaceSidebarPin.rootSpaceId, rootSpaceId),
      eq(spaceSidebarPin.spaceId, spaceId),
    ),
  });
}

export async function insertPin(input: {
  userId: UserId;
  rootSpaceId: SpaceId;
  spaceId: SpaceId;
}): Promise<SpaceSidebarPinRow> {
  const [created] = await db
    .insert(spaceSidebarPin)
    .values({
      userId: input.userId,
      rootSpaceId: input.rootSpaceId,
      spaceId: input.spaceId,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert sidebar pin");
  }

  return created;
}

export async function deletePin(
  userId: UserId,
  rootSpaceId: SpaceId,
  spaceId: SpaceId,
): Promise<boolean> {
  const deleted = await db
    .delete(spaceSidebarPin)
    .where(
      and(
        eq(spaceSidebarPin.userId, userId),
        eq(spaceSidebarPin.rootSpaceId, rootSpaceId),
        eq(spaceSidebarPin.spaceId, spaceId),
      ),
    )
    .returning({ spaceId: spaceSidebarPin.spaceId });

  return deleted.length > 0;
}

export async function findSpaceRow(spaceId: SpaceId) {
  return db.query.space.findFirst({ where: eq(space.id, spaceId) });
}

export async function listSectionPreferencesForUser(
  userId: UserId,
  rootSpaceId: SpaceId,
): Promise<SidebarSectionPreferenceRow[]> {
  return db
    .select()
    .from(sidebarSectionPreference)
    .where(
      and(
        eq(sidebarSectionPreference.userId, userId),
        eq(sidebarSectionPreference.rootSpaceId, rootSpaceId),
      ),
    )
    .orderBy(asc(sidebarSectionPreference.spaceId));
}

export async function upsertSectionPreference(input: {
  userId: UserId;
  rootSpaceId: SpaceId;
  spaceId: SpaceId;
  itemLimit: number;
}): Promise<SidebarSectionPreferenceRow> {
  const [row] = await db
    .insert(sidebarSectionPreference)
    .values({
      userId: input.userId,
      rootSpaceId: input.rootSpaceId,
      spaceId: input.spaceId,
      itemLimit: input.itemLimit,
    })
    .onConflictDoUpdate({
      target: [
        sidebarSectionPreference.userId,
        sidebarSectionPreference.rootSpaceId,
        sidebarSectionPreference.spaceId,
      ],
      set: {
        itemLimit: input.itemLimit,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to upsert sidebar section preference");
  }

  return row;
}
