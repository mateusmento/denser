import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET (or AUTH_SECRET) is required");
}

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.AUTH_URL?.replace(/\/api\/auth\/?$/, "") ??
  `http://localhost:${process.env.API_PORT ?? 3457}`;

const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:5173";

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins: [appOrigin, baseURL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
