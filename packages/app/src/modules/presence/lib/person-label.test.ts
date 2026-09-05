import assert from "node:assert/strict";
import { test } from "node:test";
import type { SpaceMember, UserId } from "@denser/contracts";
import { buildPersonRoster, personFromUserId } from "./person-label.ts";

const carolId = "00000000-0000-4000-8000-000000000003" as UserId;

test("buildPersonRoster keeps workspace member names over message fallbacks", () => {
  const members: SpaceMember[] = [
    {
      userId: carolId,
      name: "Carol Vance",
      username: "carol",
      role: "member",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const roster = buildPersonRoster(members, [
    {
      id: "msg-1",
      author: { id: carolId, name: "Member 00000000", initials: "M0" },
      body: { type: "doc", content: [] },
      createdAt: "2026-01-01T00:00:00.000Z",
      createdAtLabel: "12:00 PM",
      reactions: [],
      replyCount: 0,
      canEdit: false,
      canDelete: false,
    },
  ]);

  assert.equal(personFromUserId(carolId, roster).name, "Carol Vance");
});
