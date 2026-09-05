import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { registerDefaultPorts } from "./ports/index.js";
import { attachRealtime } from "./realtime/attach.js";
import { startSchedulingDispatcher } from "./domains/scheduling/service.js";

config({
  path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../.env"),
  quiet: true,
});

const port = Number(process.env.API_PORT ?? 3457);
const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";
const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET (or AUTH_SECRET) is required");
}

registerDefaultPorts();

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

attachRealtime(server as unknown as import("node:http").Server, appOrigin);
startSchedulingDispatcher();
