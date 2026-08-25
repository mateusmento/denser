import type { SpaceId, UserId } from "@denser/contracts";
import {
  AddSpaceMemberInput,
  CreateSpaceInput,
  PatchSpaceInput,
} from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  addSpaceMember,
  createSpace,
  deleteSpaceMember,
  getSpaceDetail,
  patchSpace,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const spaceRoutes = new Hono<{ Variables: Variables }>()
  .post("/spaces", zValidator("json", CreateSpaceInput), async (c) => {
    const userId = c.get("user").id as UserId;
    const result = await createSpace(userId, c.req.valid("json"));

    if (!result.ok) {
      if (result.reason === "invalid_visibility") {
        return c.json({ error: "Root spaces must stay private" }, 400);
      }
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
      canManage: result.canManage,
    });
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
        return c.json({ error: "Root spaces must stay private" }, 400);
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
