import type { SpaceId, UserId } from "@denser/contracts";
import { PutSidebarSectionPreferenceInput } from "@denser/contracts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  listSidebarPins,
  listSidebarSectionPreferences,
  pinSidebarSpace,
  putSidebarSectionPreference,
  unpinSidebarSpace,
} from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const sidebarPinRoutes = new Hono<{ Variables: Variables }>()
  .get("/root-spaces/:rootSpaceId/sidebar-pins", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await listSidebarPins(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ pins: result.pins });
  })
  .put("/root-spaces/:rootSpaceId/sidebar-pins/:spaceId", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await pinSidebarSpace(userId, rootSpaceId, spaceId);

    if (!result.ok) {
      if (result.reason === "space_not_found") {
        return c.json({ error: "Space not found" }, 404);
      }
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ pin: result.pin }, result.created ? 201 : 200);
  })
  .delete("/root-spaces/:rootSpaceId/sidebar-pins/:spaceId", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const spaceId = c.req.param("spaceId") as SpaceId;
    const result = await unpinSidebarSpace(userId, rootSpaceId, spaceId);

    if (!result.ok) {
      if (result.reason === "pin_not_found") {
        return c.json({ error: "Pin not found" }, 404);
      }
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.body(null, 204);
  })
  .get("/root-spaces/:rootSpaceId/sidebar-section-preferences", async (c) => {
    const userId = c.get("user").id as UserId;
    const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
    const result = await listSidebarSectionPreferences(userId, rootSpaceId);

    if (!result.ok) {
      return c.json({ error: "Root space not found" }, 404);
    }

    return c.json({ preferences: result.preferences });
  })
  .put(
    "/root-spaces/:rootSpaceId/sidebar-section-preferences/:spaceId",
    zValidator("json", PutSidebarSectionPreferenceInput),
    async (c) => {
      const userId = c.get("user").id as UserId;
      const rootSpaceId = c.req.param("rootSpaceId") as SpaceId;
      const spaceId = c.req.param("spaceId") as SpaceId;
      const input = c.req.valid("json");
      const result = await putSidebarSectionPreference(
        userId,
        rootSpaceId,
        spaceId,
        input.itemLimit,
      );

      if (!result.ok) {
        if (result.reason === "space_not_found") {
          return c.json({ error: "Space not found" }, 404);
        }
        return c.json({ error: "Root space not found" }, 404);
      }

      return c.json({ preference: result.preference });
    },
  );
