import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import type { SpaceId, UserId } from "@denser/contracts";
import { db } from "../../db/client.js";
import { user as userTable } from "../../db/schema/auth.js";
import { spaceSidebarPin } from "../../db/schema/sidebar-pins.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import * as sidebarPinsRepository from "./repository.js";
import {
  listSidebarPins,
  pinSidebarSpace,
  unpinSidebarSpace,
} from "./service.js";

type Fixture = {
  ownerId: UserId;
  outsiderId: UserId;
  rootSpaceId: SpaceId;
  childSpaceId: SpaceId;
  privateChildSpaceId: SpaceId;
  cleanup: () => Promise<void>;
};

async function makeFixture(): Promise<Fixture> {
  const ownerId = randomUUID() as UserId;
  const outsiderId = randomUUID() as UserId;
  const rootSpaceId = randomUUID() as SpaceId;
  const childSpaceId = randomUUID() as SpaceId;
  const privateChildSpaceId = randomUUID() as SpaceId;

  await db.insert(userTable).values([
    { id: ownerId, name: "Owner", email: `owner-${ownerId}@denser.test` },
    { id: outsiderId, name: "Outsider", email: `outsider-${outsiderId}@denser.test` },
  ]);

  await db.insert(space).values({
    id: rootSpaceId,
    title: "Sidebar Pins Workspace",
    visibility: "private",
    timezone: "UTC",
    createdBy: ownerId,
  });

  await db.insert(spaceMembership).values({
    spaceId: rootSpaceId,
    userId: ownerId,
    role: "owner",
  });

  await db.insert(space).values([
    {
      id: childSpaceId,
      title: "Engineering",
      parentSpaceId: rootSpaceId,
      rootSpaceId,
      visibility: "public",
      createdBy: ownerId,
    },
    {
      id: privateChildSpaceId,
      title: "Leadership",
      parentSpaceId: rootSpaceId,
      rootSpaceId,
      visibility: "private",
      timezone: "UTC",
      createdBy: ownerId,
    },
  ]);

  const cleanup = async () => {
    await db
      .delete(spaceSidebarPin)
      .where(eq(spaceSidebarPin.rootSpaceId, rootSpaceId))
      .catch(() => {});
    await db
      .delete(space)
      .where(inArray(space.id, [childSpaceId, privateChildSpaceId]))
      .catch(() => {});
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, rootSpaceId)).catch(() => {});
    await db.delete(space).where(eq(space.id, rootSpaceId)).catch(() => {});
    await db
      .delete(userTable)
      .where(inArray(userTable.id, [ownerId, outsiderId]))
      .catch(() => {});
  };

  return {
    ownerId,
    outsiderId,
    rootSpaceId,
    childSpaceId,
    privateChildSpaceId,
    cleanup,
  };
}

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("requireSpaceAccess gate returns not_found for users without workspace membership", async () => {
  const fixture = await makeFixture();
  try {
    const list = await listSidebarPins(fixture.outsiderId, fixture.rootSpaceId);
    const pin = await pinSidebarSpace(fixture.outsiderId, fixture.rootSpaceId, fixture.childSpaceId);
    const unpin = await unpinSidebarSpace(
      fixture.outsiderId,
      fixture.rootSpaceId,
      fixture.childSpaceId,
    );

    assert.equal(list.ok, false);
    assert.equal(pin.ok, false);
    assert.equal(unpin.ok, false);
  } finally {
    await fixture.cleanup();
  }
});

test("pinSidebarSpace is idempotent and does not bump pinnedAt", async () => {
  const fixture = await makeFixture();
  try {
    const first = await pinSidebarSpace(fixture.ownerId, fixture.rootSpaceId, fixture.childSpaceId);
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.created, true);

    const pinnedAt = first.pin.pinnedAt;

    const second = await pinSidebarSpace(fixture.ownerId, fixture.rootSpaceId, fixture.childSpaceId);
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.created, false);
    assert.equal(second.pin.pinnedAt, pinnedAt);
  } finally {
    await fixture.cleanup();
  }
});

test("listSidebarPins filters pins for spaces the user cannot access", async () => {
  const fixture = await makeFixture();
  try {
    await sidebarPinsRepository.insertPin({
      userId: fixture.ownerId,
      rootSpaceId: fixture.rootSpaceId,
      spaceId: fixture.privateChildSpaceId,
    });

    await db
      .delete(spaceMembership)
      .where(
        eq(spaceMembership.spaceId, fixture.privateChildSpaceId),
      );

    const result = await listSidebarPins(fixture.ownerId, fixture.rootSpaceId);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.pins.length, 0);
  } finally {
    await fixture.cleanup();
  }
});

test("deleting a pinned space cascades and removes the pin row", async () => {
  const fixture = await makeFixture();
  try {
    const pin = await pinSidebarSpace(fixture.ownerId, fixture.rootSpaceId, fixture.childSpaceId);
    assert.equal(pin.ok, true);
    if (!pin.ok) return;

    const before = await sidebarPinsRepository.findPin(
      fixture.ownerId,
      fixture.rootSpaceId,
      fixture.childSpaceId,
    );
    assert.ok(before);

    await db.delete(space).where(eq(space.id, fixture.childSpaceId));

    const after = await sidebarPinsRepository.findPin(
      fixture.ownerId,
      fixture.rootSpaceId,
      fixture.childSpaceId,
    );
    assert.equal(after, undefined);
  } finally {
    await fixture.cleanup();
  }
});
