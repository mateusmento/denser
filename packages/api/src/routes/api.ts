import { Hono } from "hono";
import { conversationRoutes } from "../domains/conversations/routes.js";
import { documentRoutes } from "../domains/documents/routes.js";
import { homeRoutes } from "../domains/home/routes.js";
import { spaceRoutes } from "../domains/spaces/routes.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const apiRoutes = new Hono<{ Variables: Variables }>()
  .route("/", homeRoutes)
  .route("/", spaceRoutes)
  .route("/", documentRoutes)
  .route("/", conversationRoutes);
