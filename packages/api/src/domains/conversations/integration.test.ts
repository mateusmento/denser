import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { user as userTable } from "../../db/schema/auth.js";
import { conversation } from "../../db/schema/conversation.js";
import { space, spaceMembership } from "../../db/schema/space.js";
import { canAccessArtifact } from "../tenancy/access.js";
import * as conversationRepository from "./repository.js";
import { createOrOpenDirectConversation, hideDirectConversation, listDirectConversations, unhideDirectConversation } from "./service.js";
import type { ArtifactId, SpaceId, UserId } from "@denser/contracts";

async function makeFixture() {
  const aliceId = randomUUID() as UserId;
  const bobId = randomUUID() as UserId;
  const rootSpaceId = randomUUID() as SpaceId;
  await db.insert(userTable).values([
    { id: aliceId, name: "Alice", email: `alice-${aliceId}@denser.test` },
    { id: bobId, name: "Bob", email: `bob-${bobId}@denser.test` },
  ]);
  await db.insert(space).values({ id: rootSpaceId, title: "DM Peers Test Workspace", visibility: "private", createdBy: aliceId });
  await db.insert(spaceMembership).values([
    { spaceId: rootSpaceId, userId: aliceId, role: "owner" },
    { spaceId: rootSpaceId, userId: bobId, role: "member" },
  ]);
  const cleanup = async () => {
    const artifacts = await db.select({ id: artifact.id }).from(artifact).innerJoin(conversation, eq(conversation.artifactId, artifact.id)).where(eq(conversation.rootSpaceId, rootSpaceId));
    const artifactIds = artifacts.map((row) => row.id);
    if (artifactIds.length > 0) await db.delete(artifact).where(inArray(artifact.id, artifactIds)).catch(() => {});
    await db.delete(spaceMembership).where(eq(spaceMembership.spaceId, rootSpaceId));
    await db.delete(space).where(eq(space.id, rootSpaceId));
    await db.delete(userTable).where(inArray(userTable.id, [aliceId, bobId]));
  };
  return { aliceId, bobId, rootSpaceId, cleanup };
}

after(async () => { await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end(); });

test("peers dedupe hide and access", async () => {
  const f = await makeFixture();
  try {
    const created = await createOrOpenDirectConversation(f.aliceId, { rootSpaceId: f.rootSpaceId, memberUserIds: [f.bobId] });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const conversationId = created.conversation.id;
    const reopened = await createOrOpenDirectConversation(f.bobId, { rootSpaceId: f.rootSpaceId, memberUserIds: [f.aliceId] });
    assert.equal(reopened.ok, true);
    if (!reopened.ok) return;
    assert.equal(reopened.created, false);
    assert.equal(reopened.conversation.id, conversationId);
    assert.equal((await hideDirectConversation(f.aliceId, conversationId)).ok, true);
    const hiddenList = await listDirectConversations(f.aliceId, f.rootSpaceId);
    assert.equal(hiddenList.ok && hiddenList.conversations.length === 0, true);
    assert.equal((await unhideDirectConversation(f.aliceId, conversationId)).ok, true);
    const visibleList = await listDirectConversations(f.aliceId, f.rootSpaceId);
    assert.equal(visibleList.ok && visibleList.conversations.length === 1, true);
  } finally { await f.cleanup(); }
});

test("access requires workspace membership", async () => {
  const f = await makeFixture();
  try {
    const created = await createOrOpenDirectConversation(f.aliceId, { rootSpaceId: f.rootSpaceId, memberUserIds: [f.bobId] });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const conversationId = created.conversation.id as ArtifactId;
    await db.delete(spaceMembership).where(and(eq(spaceMembership.spaceId, f.rootSpaceId), eq(spaceMembership.userId, f.bobId)));
    const row = await conversationRepository.findConversationByArtifactId(conversationId);
    assert.equal(await conversationRepository.canAccessDirectConversation(f.bobId, conversationId, row!.rootSpaceId!), false);
  } finally { await f.cleanup(); }
});
