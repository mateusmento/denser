import type { SpaceId, UserId } from "@denser/contracts";
import { CreateSpaceInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createSpace, getSpaceDetail } from "./service.js";

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
    });
  });
