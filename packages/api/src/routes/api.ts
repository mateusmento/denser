import { Hono } from "hono";
import { conversationRoutes } from "../domains/conversations/routes.js";
import { documentRoutes } from "../domains/documents/routes.js";
import { homeRoutes } from "../domains/home/routes.js";
import { messageRoutes } from "../domains/messages/routes.js";
import { spaceRoutes, spaceSprintRoutes } from "../domains/spaces/routes.js";
import { documentTypeRoutes } from "../domains/workflows/routes.js";

type Variables = {
  user: { id: string; name: string; email: string };
};

export const apiRoutes = new Hono<{ Variables: Variables }>()
  .route("/", homeRoutes)
  .route("/", spaceRoutes)
  .route("/", spaceSprintRoutes)
  .route("/", documentRoutes)
  .route("/", conversationRoutes)
  .route("/", messageRoutes)
  .route("/", documentTypeRoutes);
