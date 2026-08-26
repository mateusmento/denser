import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env"),
  quiet: true,
});

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const DRIZZLE_MIGRATION_BOOTSTRAP_NOTICES = [
  'schema "drizzle" already exists, skipping',
  'relation "__drizzle_migrations" already exists, skipping',
] as const;

function isDrizzleMigrationBootstrapNotice(notice: { message?: string }) {
  const message = notice.message ?? "";
  return DRIZZLE_MIGRATION_BOOTSTRAP_NOTICES.some((text) => message.includes(text));
}

const client = postgres(url, {
  max: 1,
  onnotice: (notice) => {
    if (isDrizzleMigrationBootstrapNotice(notice)) return;
    console.warn(notice);
  },
});
const db = drizzle(client);

await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
await client.end();
console.log("Migrations applied.");
