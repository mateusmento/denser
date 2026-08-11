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

const client = postgres(url, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
await client.end();
console.log("Migrations applied.");
