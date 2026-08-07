import { Hono } from "hono";
import { authHandler, initAuthConfig, verifyAuth } from "@hono/auth-js";
import { cors } from "hono/cors";
import { createAuthConfig } from "./auth/config.js";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET is required");
}

const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

app.use(
  "*",
  initAuthConfig(() => createAuthConfig(authSecret)),
);

app.use("/api/auth/*", authHandler());

app.get("/api/health", (c) => c.json({ ok: true as const }));

app.use("/api/*", verifyAuth());

app.get("/api/me", (c) => {
  const authUser = c.get("authUser");
  return c.json({ user: authUser.session.user });
});
