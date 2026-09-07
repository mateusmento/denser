import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import {
  createScheduledMessageJob,
  SCHEDULER_TIMEZONE_CHANGED_EVENT,
  type ArtifactId,
  type SpaceId,
  type UserId,
} from "@denser/contracts";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { conversation } from "../../db/schema/conversation.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { notifySchedulersTimezoneChanged } from "./notify-schedulers-timezone-change.js";
import { recomputeScheduledJobsForPrivateSpace } from "./timezone-recompute.js";
import { patchSpace } from "../spaces/service.js";
import { createJob } from "../scheduling/service.js";
import { bindUserNotificationsRealtime } from "../../realtime/user-notifications.js";
import { userRoom } from "../../realtime/rooms.js";

type Fixture = {
  managerId: UserId;
  schedulerId: UserId;
  bystanderId: UserId;
  spaceId: SpaceId;
  otherSpaceId: SpaceId;
  conversationId: ArtifactId;
  otherConversationId: ArtifactId;
  jobIds: string[];
  cleanup: () => Promise<void>;
};

const emitted: Array<{ userId: UserId; event: string; payload: unknown }> = [];

const mockServer = {
  to(room: string) {
    return {
      emit(event: string, payload: unknown) {
        const userId = room.startsWith("user:") ? (room.slice(5) as UserId) : null;
        if (userId) {
          emitted.push({ userId, event, payload });
        }
      },
    };
  },
};

async function makeFixture(): Promise<Fixture> {
  const managerId = randomUUID() as UserId;
  const schedulerId = randomUUID() as UserId;
  const bystanderId = randomUUID() as UserId;
  const spaceId = randomUUID() as SpaceId;
  const otherSpaceId = randomUUID() as SpaceId;
  const conversationId = randomUUID() as ArtifactId;
  const otherConversationId = randomUUID() as ArtifactId;
  const jobIds: string[] = [];

  const users = [
    { id: managerId, name: "Manager", email: `manager-${managerId}@denser.test` },
    { id: schedulerId, name: "Scheduler", email: `scheduler-${schedulerId}@denser.test` },
    { id: bystanderId, name: "Bystander", email: `bystander-${bystanderId}@denser.test` },
  ];

  await db.insert(userTable).values(users);

  await db.insert(space).values([
    {
      id: spaceId,
      title: "Private Team",
      visibility: "private",
      timezone: "America/Sao_Paulo",
      createdBy: managerId,
    },
    {
      id: otherSpaceId,
      title: "Other Private",
      visibility: "private",
      timezone: "America/New_York",
      createdBy: bystanderId,
    },
  ]);

  await db.insert(spaceMembership).values([
    { spaceId, userId: managerId, role: "owner" },
    { spaceId: otherSpaceId, userId: bystanderId, role: "owner" },
  ]);

  await db.insert(artifact).values([
    {
      id: conversationId,
      kind: "conversation",
      title: "Team Channel",
      spaceId,
      rootSpaceId: spaceId,
      createdBy: managerId,
    },
    {
      id: otherConversationId,
      kind: "conversation",
      title: "Other Channel",
      spaceId: otherSpaceId,
      rootSpaceId: otherSpaceId,
      createdBy: bystanderId,
    },
  ]);

  await db.insert(conversation).values([
    { artifactId: conversationId, conversationKind: "regular" },
    { artifactId: otherConversationId, conversationKind: "regular" },
  ]);

  const dueAt = "2030-06-15T14:30:00.000Z";
  const job = createScheduledMessageJob(
    {
      rootSpaceId: spaceId,
      dueAt,
      nextRunAt: dueAt,
      timezone: "America/Sao_Paulo",
      recurrence: { frequency: "once" },
    },
    {
      conversationId,
      senderId: schedulerId,
      body: { type: "doc", content: [] },
    },
  );
  const otherJob = createScheduledMessageJob(
    {
      rootSpaceId: otherSpaceId,
      dueAt,
      nextRunAt: dueAt,
      timezone: "America/New_York",
      recurrence: { frequency: "once" },
    },
    {
      conversationId: otherConversationId,
      senderId: bystanderId,
      body: { type: "doc", content: [] },
    },
  );

  jobIds.push(await createJob(job));
  jobIds.push(await createJob(otherJob));

  const cleanup = async () => {
    await db.delete(scheduledJob).where(inArray(scheduledJob.id, jobIds as never));
    await db.delete(conversation).where(
      inArray(conversation.artifactId, [conversationId, otherConversationId]),
    );
    await db.delete(artifact).where(inArray(artifact.id, [conversationId, otherConversationId]));
    await db
      .delete(spaceMembership)
      .where(inArray(spaceMembership.spaceId, [spaceId, otherSpaceId]));
    await db.delete(space).where(inArray(space.id, [spaceId, otherSpaceId]));
    await db.delete(userTable).where(inArray(userTable.id, [managerId, schedulerId, bystanderId]));
  };

  return {
    managerId,
    schedulerId,
    bystanderId,
    spaceId,
    otherSpaceId,
    conversationId,
    otherConversationId,
    jobIds,
    cleanup,
  };
}

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("recomputeScheduledJobsForPrivateSpace collects distinct scheduler ids", async () => {
  const fixture = await makeFixture();
  try {
    const result = await recomputeScheduledJobsForPrivateSpace(
      fixture.spaceId,
      "America/New_York",
    );

    assert.equal(result.updated, 1);
    assert.deepEqual(result.schedulerIds, [fixture.schedulerId]);
  } finally {
    await fixture.cleanup();
  }
});

test("notifySchedulersTimezoneChanged emits only to affected schedulers", async () => {
  bindUserNotificationsRealtime(mockServer as never);
  emitted.length = 0;

  const schedulerId = randomUUID() as UserId;
  const bystanderId = randomUUID() as UserId;
  const spaceId = randomUUID() as SpaceId;

  await notifySchedulersTimezoneChanged({
    spaceId,
    spaceTitle: "Private Team",
    schedulerIds: [schedulerId],
    adjustedJobCount: 2,
  });

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0]?.userId, schedulerId);
  assert.equal(emitted[0]?.event, SCHEDULER_TIMEZONE_CHANGED_EVENT);
  assert.deepEqual(emitted[0]?.payload, {
    spaceId,
    spaceTitle: "Private Team",
    adjustedJobCount: 2,
  });
  assert.ok(!emitted.some((entry) => entry.userId === bystanderId));
  assert.equal(userRoom(schedulerId), `user:${schedulerId}`);
});

test("patchSpace timezone change recomputes jobs and notifies scheduler", async () => {
  bindUserNotificationsRealtime(mockServer as never);
  emitted.length = 0;

  const fixture = await makeFixture();
  try {
    const result = await patchSpace(fixture.managerId, fixture.spaceId, {
      timezone: "America/New_York",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;

    const recomputed = await db.query.scheduledJob.findFirst({
      where: eq(scheduledJob.id, fixture.jobIds[0] as never),
    });
    assert.equal(recomputed?.timezone, "America/New_York");

    assert.equal(emitted.length, 1);
    assert.equal(emitted[0]?.userId, fixture.schedulerId);
    assert.equal(emitted[0]?.event, SCHEDULER_TIMEZONE_CHANGED_EVENT);
    assert.deepEqual(emitted[0]?.payload, {
      spaceId: fixture.spaceId,
      spaceTitle: "Private Team",
      adjustedJobCount: 1,
    });
    assert.ok(!emitted.some((entry) => entry.userId === fixture.bystanderId));
  } finally {
    await fixture.cleanup();
  }
});
