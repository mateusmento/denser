import Credentials from "@auth/core/providers/credentials";
import type { AuthConfig } from "@auth/core";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function createAuthConfig(secret: string): AuthConfig {
  return {
    secret,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
      Credentials({
        id: "credentials",
        name: "Credentials",
        credentials: {
          username: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (raw) => {
          const parsed = credentialsSchema.safeParse(raw);
          if (!parsed.success) return null;

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, parsed.data.username))
            .limit(1);

          if (!user) return null;

          const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            name: user.displayName,
            email: `${user.username}@local.dev`,
          };
        },
      }),
    ],
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user?.id) {
          token.sub = user.id;
          if (user.name != null) token.name = user.name;
        }
        return token;
      },
      session: async ({ session, token }) => {
        if (session.user && token.sub) {
          session.user.id = token.sub;
          if (typeof token.name === "string") session.user.name = token.name;
        }
        return session;
      },
    },
  };
}
