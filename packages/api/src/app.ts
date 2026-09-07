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
    allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
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

app.get("/api/me", async (c) => {
  const user = c.get("user");
  const timezoneRow = await import("./domains/users/repository.js").then((m) =>
    m.findUserTimezone(user.id as import("@denser/contracts").UserId),
  );
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: timezoneRow?.timezone ?? null,
      timezoneSource: timezoneRow?.timezoneSource ?? "auto",
    },
  });
});

app.patch("/api/me", async (c) => {
  const { PatchMeInput } = await import("@denser/contracts");
  const user = c.get("user");
  const body = PatchMeInput.parse(await c.req.json());
  const { updateUserTimezone } = await import("./domains/users/repository.js");
  const updated = await updateUserTimezone(user.id as import("@denser/contracts").UserId, {
    timezone: body.timezone,
    timezoneSource: body.timezoneSource ?? "manual",
  });
  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: updated?.timezone ?? body.timezone,
      timezoneSource: updated?.timezoneSource ?? body.timezoneSource ?? "manual",
    },
  });
});

app.route("/api", apiRoutes);
