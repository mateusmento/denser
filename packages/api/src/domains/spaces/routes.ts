import type { SpaceId, UserId } from "@denser/contracts";
import { AddSpaceMemberInput, CreateSpaceInput, PatchSpaceInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  addSpaceMember,
  completeSprint,
  createSpace,
  deleteSpace,
  deleteSpaceMember,
  enableSprints,
  getSpaceDetail,
  patchSpace,
  startSprint,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const spaceRoutes = new Hono<{ Variables: Variables }>()
  .post("/spaces", zValidator("json", CreateSpaceInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const result = await createSpace(userId, c.req.valid("json"));

    if (!result.ok) {
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({ space: result.space }, 201);
  })
  .get("/spaces/:spaceId", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await getSpaceDetail(userId, spaceId);

    if (!result.ok) {
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({
      space: result.space,
      childSpaces: result.childSpaces,
      artifacts: result.artifacts,
      members: result.members,
      assignableMembers: result.assignableMembers,
      canManage: result.canManage,
      workflow: result.workflow,
      documentTypes: result.documentTypes,
    });
  })
  .delete("/spaces/:spaceId", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await deleteSpace(userId, spaceId);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      return c.json({ error: "Space not found" }, 404);
    }

    return c.body(null, 204);
  })
  .patch("/spaces/:spaceId", zValidator("json", PatchSpaceInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await patchSpace(userId, spaceId, c.req.valid("json"));

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (result.reason === "invalid_visibility") {
        return c.json({ error: "Cannot make a private space public" }, 400);
      }
      if (result.reason === "invalid_parent") {
        return c.json({ error: "Cannot move a space into itself" }, 400);
      }
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({ space: result.space });
  })
  .post("/spaces/:spaceId/members", zValidator("json", AddSpaceMemberInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await addSpaceMember(userId, spaceId, c.req.valid("json"));

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (result.reason === "user_not_found") {
        return c.json({ error: "User not found" }, 404);
      }
      if (result.reason === "already_member") {
        return c.json({ error: "Already a member" }, 409);
      }
      if (result.reason === "membership_disabled") {
        return c.json({ error: "Membership is only available on private workspaces" }, 400);
      }
      return c.json({ error: "Space not found" }, 404);
    }

    return c.json({ member: result.member }, 201);
  })
  .delete("/spaces/:spaceId/members/:memberUserId", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const memberUserId = c.req.param("memberUserId") as UserId;
    const result = await deleteSpaceMember(userId, spaceId, memberUserId);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        return c.json({ error: "Forbidden" }, 403);
      }
      if (result.reason === "last_owner") {
        return c.json({ error: "Cannot remove the last owner" }, 409);
      }
      return c.json({ error: "Member not found" }, 404);
    }

    return c.body(null, 204);
  });

function sprintClockError(reason: string) {
  if (reason === "forbidden") return { status: 403 as const, error: "Forbidden" };
  if (reason === "not_project")
    return { status: 400 as const, error: "Cannot enable sprints on a sprint space" };
  if (reason === "sprints_disabled")
    return { status: 400 as const, error: "Sprinting is not enabled" };
  if (reason === "already_active")
    return { status: 409 as const, error: "A sprint is already active" };
  if (reason === "no_upcoming") return { status: 400 as const, error: "No upcoming sprint" };
  if (reason === "no_active") return { status: 400 as const, error: "No active sprint" };
  return { status: 404 as const, error: "Space not found" };
}

export const spaceSprintRoutes = new Hono<{ Variables: Variables }>()
  .post("/spaces/:spaceId/sprints/enable", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await enableSprints(userId, spaceId);
    if (!result.ok) {
      const error = sprintClockError(result.reason);
      return c.json({ error: error.error }, error.status);
    }
    return c.json({ space: result.space });
  })
  .post("/spaces/:spaceId/sprints/start", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await startSprint(userId, spaceId);
    if (!result.ok) {
      const error = sprintClockError(result.reason);
      return c.json({ error: error.error }, error.status);
    }
    return c.json({ space: result.space });
  })
  .post("/spaces/:spaceId/sprints/complete", async (c) => {
    const userId = c.get("user").id as UserId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await completeSprint(userId, spaceId);
    if (!result.ok) {
      const error = sprintClockError(result.reason);
      return c.json({ error: error.error }, error.status);
    }
    return c.json({ space: result.space });
  });
