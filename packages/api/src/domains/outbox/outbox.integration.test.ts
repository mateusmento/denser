import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import {
  createScheduledMessageJob,
  type ArtifactId,
  type MessageDraftId,
  type ScheduledJobId,
  type SpaceId,
  type UserId,
} from "@denser/contracts";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { conversation } from "../../db/schema/conversation.js";
import { messageDraft } from "../../db/schema/message-draft.js";
import { scheduledJob } from "../../db/schema/scheduled-job.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { createJob } from "../scheduling/service.js";
import * as draftRepository from "../drafts/repository.js";
import {
  countDraftsForUser,
  countScheduledMessagesForUser,
  listDraftsForUser,
  listScheduledMessagesForUser,
} from "./service.js";

type Fixture = {
  ownerId: UserId;
  memberId: UserId;
  outsiderId: UserId;
  rootSpaceId: SpaceId;
  conversationId: ArtifactId;
  otherConversationId: ArtifactId;
  draftIds: MessageDraftId[];
  jobIds: ScheduledJobId[];
  cleanup: () => Promise<void>;
};

function body(text: string): unknown {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

const emptyBody = { type: "doc", content: [] };

async function makeFixture(): Promise<Fixture> {
  const ownerId = randomUUID() as UserId;
  const memberId = randomUUID() as UserId;
  const outsiderId = randomUUID() as UserId;
  const rootSpaceId = randomUUID() as SpaceId;
  const conversationId = randomUUID() as ArtifactId;
  const otherConversationId = randomUUID() as ArtifactId;
  const draftIds: MessageDraftId[] = [];
  const jobIds: ScheduledJobId[] = [];
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const dueAt = "2030-06-15T14:30:00.000Z";

  await db.insert(userTable).values([
    { id: ownerId, name: "Owner", email: `owner-${ownerId}@denser.test` },
    { id: memberId, name: "Member", email: `member-${memberId}@denser.test` },
    { id: outsiderId, name: "Outsider", email: `outsider-${outsiderId}@denser.test` },
  ]);

  await db.insert(space).values({
    id: rootSpaceId,
    title: "Outbox Test Workspace",
    visibility: "private",
    timezone: "UTC",
    createdBy: ownerId,
  });

  await db.insert(spaceMembership).values([
    { spaceId: rootSpaceId, userId: ownerId, role: "owner" },
    { spaceId: rootSpaceId, userId: memberId, role: "member" },
  ]);

  await db.insert(artifact).values([
    {
      id: conversationId,
      kind: "conversation",
      title: "Outbox Channel",
      spaceId: rootSpaceId,
      rootSpaceId,
      createdBy: ownerId,
    },
    {
      id: otherConversationId,
      kind: "conversation",
      title: "Other Channel",
      spaceId: rootSpaceId,
      rootSpaceId,
      createdBy: ownerId,
    },
  ]);

  await db.insert(conversation).values([
    { artifactId: conversationId, conversationKind: "regular", rootSpaceId },
    { artifactId: otherConversationId, conversationKind: "regular", rootSpaceId },
  ]);

  const ownerNonEmpty = await draftRepository.insertDraft({
    rootSpaceId,
    conversationId,
    authorId: ownerId,
    threadId: null,
    body: body("Owner draft"),
    quotesId: null,
    version: 0,
    expiresAt,
  });
  draftIds.push(ownerNonEmpty.id);

  const ownerEmpty = await draftRepository.insertDraft({
    rootSpaceId,
    conversationId: otherConversationId,
    authorId: ownerId,
    threadId: null,
    body: emptyBody,
    quotesId: null,
    version: 0,
    expiresAt,
  });
  draftIds.push(ownerEmpty.id);

  const memberDraft = await draftRepository.insertDraft({
    rootSpaceId,
    conversationId,
    authorId: memberId,
    threadId: null,
    body: body("Member draft"),
    quotesId: null,
    version: 0,
    expiresAt,
  });
  draftIds.push(memberDraft.id);

  const ownerActiveJob = createScheduledMessageJob(
    { rootSpaceId, dueAt, nextRunAt: dueAt, timezone: "UTC", recurrence: { frequency: "once" } },
    { conversationId, senderId: ownerId, body: body("Owner scheduled") },
  );
  jobIds.push(await createJob(ownerActiveJob));

  const ownerProcessedJob = createScheduledMessageJob(
    { rootSpaceId, dueAt, nextRunAt: dueAt, timezone: "UTC", recurrence: { frequency: "once" } },
    { conversationId, senderId: ownerId, body: body("Owner processed") },
  );
  const processedJobId = await createJob(ownerProcessedJob);
  jobIds.push(processedJobId);
  await db
    .update(scheduledJob)
    .set({ processed: true })
    .where(eq(scheduledJob.id, processedJobId));

  const memberJob = createScheduledMessageJob(
    { rootSpaceId, dueAt, nextRunAt: dueAt, timezone: "UTC", recurrence: { frequency: "once" } },
    { conversationId, senderId: memberId, body: body("Member scheduled") },
  );
  jobIds.push(await createJob(memberJob));

  const cleanup = async () => {
    if (draftIds.length > 0) {
      await db.delete(messageDraft).where(inArray(messageDraft.id, draftIds)).catch(() => {});
    }
    if (jobIds.length > 0) {
      await db.delete(scheduledJob).where(inArray(scheduledJob.id, jobIds)).catch(() => {});
    }
    await db
      .delete(conversation)
      .where(inArray(conversation.artifactId, [conversationId, otherConversationId]))
      .catch(() => {});
    await db
      .delete(artifact)
      .where(inArray(artifact.id, [conversationId, otherConversationId]))
      .catch(() => {});
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, rootSpaceId)).catch(() => {});
    await db.delete(space).where(eq(space.id, rootSpaceId)).catch(() => {});
    await db
      .delete(userTable)
      .where(inArray(userTable.id, [ownerId, memberId, outsiderId]))
      .catch(() => {});
  };

  return {
    ownerId,
    memberId,
    outsiderId,
    rootSpaceId,
    conversationId,
    otherConversationId,
    draftIds,
    jobIds,
    cleanup,
  };
}

after(async () => {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("requireSpaceAccess gate returns not_found for users without workspace membership", async () => {
  const fixture = await makeFixture();
  try {
    const listDrafts = await listDraftsForUser(fixture.outsiderId, fixture.rootSpaceId);
    const countDrafts = await countDraftsForUser(fixture.outsiderId, fixture.rootSpaceId);
    const listScheduled = await listScheduledMessagesForUser(fixture.outsiderId, fixture.rootSpaceId);
    const countScheduled = await countScheduledMessagesForUser(fixture.outsiderId, fixture.rootSpaceId);

    assert.equal(listDrafts.ok, false);
    assert.equal(countDrafts.ok, false);
    assert.equal(listScheduled.ok, false);
    assert.equal(countScheduled.ok, false);
  } finally {
    await fixture.cleanup();
  }
});

test("listDraftsForUser filters to caller-owned non-empty drafts only", async () => {
  const fixture = await makeFixture();
  try {
    const ownerResult = await listDraftsForUser(fixture.ownerId, fixture.rootSpaceId);
    assert.equal(ownerResult.ok, true);
    if (!ownerResult.ok) return;

    assert.equal(ownerResult.drafts.length, 1);
    assert.equal(ownerResult.drafts[0]?.conversationId, fixture.conversationId);
    assert.deepEqual(ownerResult.drafts[0]?.body, body("Owner draft"));

    const memberResult = await listDraftsForUser(fixture.memberId, fixture.rootSpaceId);
    assert.equal(memberResult.ok, true);
    if (!memberResult.ok) return;

    assert.equal(memberResult.drafts.length, 1);
    assert.deepEqual(memberResult.drafts[0]?.body, body("Member draft"));
  } finally {
    await fixture.cleanup();
  }
});

test("countDraftsForUser matches non-empty owned draft count", async () => {
  const fixture = await makeFixture();
  try {
    const ownerCount = await countDraftsForUser(fixture.ownerId, fixture.rootSpaceId);
    const memberCount = await countDraftsForUser(fixture.memberId, fixture.rootSpaceId);

    assert.equal(ownerCount.ok, true);
    if (!ownerCount.ok) return;
    assert.equal(ownerCount.count, 1);

    assert.equal(memberCount.ok, true);
    if (!memberCount.ok) return;
    assert.equal(memberCount.count, 1);
  } finally {
    await fixture.cleanup();
  }
});

test("listScheduledMessagesForUser filters to caller-owned unprocessed jobs only", async () => {
  const fixture = await makeFixture();
  try {
    const ownerResult = await listScheduledMessagesForUser(fixture.ownerId, fixture.rootSpaceId);
    assert.equal(ownerResult.ok, true);
    if (!ownerResult.ok) return;

    assert.equal(ownerResult.scheduledMessages.length, 1);
    assert.equal(ownerResult.scheduledMessages[0]?.conversationId, fixture.conversationId);
    assert.deepEqual(ownerResult.scheduledMessages[0]?.body, body("Owner scheduled"));

    const memberResult = await listScheduledMessagesForUser(fixture.memberId, fixture.rootSpaceId);
    assert.equal(memberResult.ok, true);
    if (!memberResult.ok) return;

    assert.equal(memberResult.scheduledMessages.length, 1);
    assert.deepEqual(memberResult.scheduledMessages[0]?.body, body("Member scheduled"));
  } finally {
    await fixture.cleanup();
  }
});

test("countScheduledMessagesForUser matches unprocessed owned job count", async () => {
  const fixture = await makeFixture();
  try {
    const ownerCount = await countScheduledMessagesForUser(fixture.ownerId, fixture.rootSpaceId);
    const memberCount = await countScheduledMessagesForUser(fixture.memberId, fixture.rootSpaceId);

    assert.equal(ownerCount.ok, true);
    if (!ownerCount.ok) return;
    assert.equal(ownerCount.count, 1);

    assert.equal(memberCount.ok, true);
    if (!memberCount.ok) return;
    assert.equal(memberCount.count, 1);
  } finally {
    await fixture.cleanup();
  }
});
