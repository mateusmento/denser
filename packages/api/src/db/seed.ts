import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { faker } from "@faker-js/faker";
import { db } from "./client.js";
import { account, session, user } from "./schema.js";

config({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env") });

type Hero = { username: string; displayName: string };

const password = process.env.SEED_PASSWORD ?? "password";
const mode = process.env.SEED_MODE === "full" ? "full" : "minimal";
const heroesPath = fileURLToPath(new URL("./seed-heroes.json", import.meta.url));
const heroes = JSON.parse(readFileSync(heroesPath, "utf8")) as Hero[];

faker.seed(42);

const passwordHash = await hashPassword(password);

await db.delete(session);
await db.delete(account);
await db.delete(user);

async function insertCredentialUser(input: {
  username: string;
  displayName: string;
}): Promise<void> {
  const [created] = await db
    .insert(user)
    .values({
      name: input.displayName,
      email: `${input.username}@local.dev`,
      emailVerified: true,
      username: input.username,
      displayUsername: input.username,
    })
    .returning({ id: user.id });

  if (!created) {
    throw new Error(`Failed to create user ${input.username}`);
  }

  await db.insert(account).values({
    accountId: created.id,
    providerId: "credential",
    userId: created.id,
    password: passwordHash,
  });
}

for (const hero of heroes) {
  await insertCredentialUser(hero);
}

if (mode === "full") {
  const bulk = Array.from({ length: 8 }, () => ({
    username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24),
    displayName: faker.person.fullName(),
  }));
  const unique = [...new Map(bulk.map((u) => [u.username, u])).values()].filter(
    (u) => u.username.length >= 3 && !heroes.some((h) => h.username === u.username),
  );
  for (const row of unique) {
    await insertCredentialUser(row);
  }
}

console.log(`Seeded users (mode=${mode}, password=${password}).`);
process.exit(0);
