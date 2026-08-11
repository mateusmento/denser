import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

config({
  path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env"),
  quiet: true,
});

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(url);
export const db = drizzle(client, { schema });
