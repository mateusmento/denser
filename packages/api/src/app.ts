import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth/index.js";
import { apiRoutes } from "./routes/api.js";

const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";

type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
};

export const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: appOrigin,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PATCH", "OPTIONS"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/health", (c) => c.json({ ok: true as const }));

app.use("/api/*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.get("/api/me", (c) => {
  const user = c.get("user");
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.route("/api", apiRoutes);
