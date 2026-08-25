import type { UserId } from "@denser/contracts";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { account, session, user } from "./schema/auth.js";
import { artifact } from "./schema/artifact.js";
import { document } from "./schema/document.js";
import { space, spaceMembership } from "./schema/space.js";
import { EMPTY_TIPTAP_DOC } from "../domains/documents/constants.js";
import {
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_SPACE_ACME,
  SEED_SPACE_ENGINEERING,
} from "./seed-ids.js";

config({
  path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env"),
  quiet: true,
});

type Hero = { id: string; username: string; displayName: string };

const password = process.env.SEED_PASSWORD ?? "password";
const mode = process.env.SEED_MODE === "full" ? "full" : "minimal";
const reset = process.env.SEED_RESET === "1";
const heroesPath = fileURLToPath(new URL("./seed-heroes.json", import.meta.url));
const heroes = JSON.parse(readFileSync(heroesPath, "utf8")) as Hero[];

faker.seed(42);

const passwordHash = await hashPassword(password);

if (reset) {
  await db.delete(document);
  await db.delete(artifact);
  await db.delete(spaceMembership);
  await db.delete(space);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
  console.log("SEED_RESET=1: cleared auth and domain tables.");
}

async function upsertCredentialUser(input: {
  id: UserId;
  username: string;
  displayName: string;
}): Promise<UserId> {
  const [row] = await db
    .insert(user)
    .values({
      id: input.id,
      name: input.displayName,
      email: `${input.username}@local.dev`,
      emailVerified: true,
      username: input.username,
      displayUsername: input.username,
    })
    .onConflictDoUpdate({
      target: user.username,
      set: {
        name: input.displayName,
        email: `${input.username}@local.dev`,
        emailVerified: true,
        displayUsername: input.username,
        updatedAt: new Date(),
      },
    })
    .returning({ id: user.id });

  if (!row) {
    throw new Error(`Failed to upsert user ${input.username}`);
  }

  const existingAccount = await db.query.account.findFirst({
    where: eq(account.userId, row.id),
    columns: { id: true },
  });

  if (existingAccount) {
    await db
      .update(account)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(account.userId, row.id));
    return row.id;
  }

  await db.insert(account).values({
    accountId: row.id,
    providerId: "credential",
    userId: row.id,
    password: passwordHash,
  });

  return row.id;
}

async function seedBulkUsers(): Promise<void> {
  const bulk = Array.from({ length: 8 }, () => ({
    username: faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24),
    displayName: faker.person.fullName(),
  }));
  const unique = [...new Map(bulk.map((u) => [u.username, u])).values()].filter(
    (u) => u.username.length >= 3 && !heroes.some((h) => h.username === u.username),
  );

  for (const row of unique) {
    const [upserted] = await db
      .insert(user)
      .values({
        name: row.displayName,
        email: `${row.username}@local.dev`,
        emailVerified: true,
        username: row.username,
        displayUsername: row.username,
      })
      .onConflictDoUpdate({
        target: user.username,
        set: {
          name: row.displayName,
          updatedAt: new Date(),
        },
      })
      .returning({ id: user.id });

    if (!upserted) continue;

    const existingAccount = await db.query.account.findFirst({
      where: eq(account.userId, upserted.id),
      columns: { id: true },
    });

    if (existingAccount) {
      await db
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(account.userId, upserted.id));
      continue;
    }

    await db.insert(account).values({
      accountId: upserted.id,
      providerId: "credential",
      userId: upserted.id,
      password: passwordHash,
    });
  }
}

async function resolveAliceId(): Promise<UserId> {
  const alice = await db.query.user.findFirst({
    where: eq(user.username, "alice"),
    columns: { id: true },
  });
  if (!alice) {
    throw new Error("Seed requires user alice");
  }
  return alice.id;
}

async function seedWorkspaceDemo(aliceId: UserId): Promise<void> {
  await db
    .insert(space)
    .values({
      id: SEED_SPACE_ACME,
      title: "Acme",
      visibility: "private",
      createdBy: aliceId,
    })
    .onConflictDoUpdate({
      target: space.id,
      set: { title: "Acme", visibility: "private", createdBy: aliceId, updatedAt: new Date() },
    });

  await db
    .insert(spaceMembership)
    .values({
      spaceId: SEED_SPACE_ACME,
      userId: aliceId,
      role: "owner",
    })
    .onConflictDoUpdate({
      target: [spaceMembership.spaceId, spaceMembership.userId],
      set: { role: "owner" },
    });

  await db
    .insert(space)
    .values({
      id: SEED_SPACE_ENGINEERING,
      title: "Engineering",
      parentSpaceId: SEED_SPACE_ACME,
      rootSpaceId: SEED_SPACE_ACME,
      visibility: "public",
      createdBy: aliceId,
    })
    .onConflictDoUpdate({
      target: space.id,
      set: {
        title: "Engineering",
        parentSpaceId: SEED_SPACE_ACME,
        rootSpaceId: SEED_SPACE_ACME,
        visibility: "public",
        createdBy: aliceId,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(artifact)
    .values({
      id: SEED_ARTIFACT_PERSONAL_NOTES,
      kind: "document",
      title: "Personal notes",
      createdBy: aliceId,
    })
    .onConflictDoUpdate({
      target: artifact.id,
      set: { title: "Personal notes", createdBy: aliceId, updatedAt: new Date() },
    });

  await db
    .insert(document)
    .values({
      artifactId: SEED_ARTIFACT_PERSONAL_NOTES,
      body: EMPTY_TIPTAP_DOC,
    })
    .onConflictDoNothing({ target: document.artifactId });

  await db
    .insert(artifact)
    .values({
      id: SEED_ARTIFACT_ONBOARDING_NOTES,
      kind: "document",
      title: "Onboarding notes",
      spaceId: SEED_SPACE_ENGINEERING,
      rootSpaceId: SEED_SPACE_ACME,
      createdBy: aliceId,
    })
    .onConflictDoUpdate({
      target: artifact.id,
      set: {
        title: "Onboarding notes",
        spaceId: SEED_SPACE_ENGINEERING,
        rootSpaceId: SEED_SPACE_ACME,
        createdBy: aliceId,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(document)
    .values({
      artifactId: SEED_ARTIFACT_ONBOARDING_NOTES,
      body: EMPTY_TIPTAP_DOC,
    })
    .onConflictDoNothing({ target: document.artifactId });
}

for (const hero of heroes) {
  await upsertCredentialUser({
    id: hero.id as UserId,
    username: hero.username,
    displayName: hero.displayName,
  });
}

if (mode === "full") {
  await seedBulkUsers();
}

const aliceId = await resolveAliceId();
await seedWorkspaceDemo(aliceId);

console.log(
  `Seeded users and workspace demo (mode=${mode}, reset=${reset}, password=${password}).`,
);
console.log(`  alice            → ${aliceId}`);
console.log(`  onboarding notes → ${SEED_ARTIFACT_ONBOARDING_NOTES}`);
process.exit(0);
