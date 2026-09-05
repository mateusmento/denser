import { Hono } from "hono";
import { attachmentRoutes } from "../domains/attachments/routes.js";
import { conversationRoutes } from "../domains/conversations/routes.js";
import { documentRoutes } from "../domains/documents/routes.js";
import { draftRoutes } from "../domains/drafts/routes.js";
import { homeRoutes } from "../domains/home/routes.js";
import { messageRoutes } from "../domains/messages/routes.js";
import { readStateRoutes } from "../domains/read-state/routes.js";
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
  .route("/", draftRoutes)
  .route("/", readStateRoutes)
  .route("/", attachmentRoutes)
  .route("/", documentTypeRoutes);
