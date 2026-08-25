import type { UserId } from "@denser/contracts";
import { Hono } from "hono";
import { getHome } from "./service.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const homeRoutes = new Hono<{ Variables: Variables }>().get("/home", async (c) => {
  const userId = c.get("user").id as UserId;
  return c.json(await getHome(userId));
});
