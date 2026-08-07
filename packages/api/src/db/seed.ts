import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { db } from "./client.js";
import { users } from "./schema.js";

config({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env") });


type Hero = { username: string; displayName: string };

const password = process.env.SEED_PASSWORD ?? "password";
const mode = process.env.SEED_MODE === "full" ? "full" : "minimal";
const heroesPath = fileURLToPath(new URL("./seed-heroes.json", import.meta.url));
const heroes = JSON.parse(readFileSync(heroesPath, "utf8")) as Hero[];

faker.seed(42);

const passwordHash = await bcrypt.hash(password, 10);

await db.delete(users);

await db.insert(users).values(
  heroes.map((hero) => ({
    username: hero.username,
    displayName: hero.displayName,
    passwordHash,
  })),
);

if (mode === "full") {
  const bulk = Array.from({ length: 8 }, () => ({
    username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24),
    displayName: faker.person.fullName(),
    passwordHash,
  }));
  const unique = [...new Map(bulk.map((u) => [u.username, u])).values()].filter(
    (u) => !heroes.some((h) => h.username === u.username),
  );
  if (unique.length > 0) {
    await db.insert(users).values(unique);
  }
}

console.log(`Seeded users (mode=${mode}, password=${password}).`);
process.exit(0);
