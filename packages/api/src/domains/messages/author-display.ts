import type { UserId } from "@denser/contracts";
import { inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { user } from "../../db/schema/auth.js";
import type { AuthorDisplay } from "./quoted-enrichment.js";

export async function loadAuthorDisplay(
  userIds: readonly UserId[],
): Promise<Map<UserId, AuthorDisplay>> {
  if (userIds.length === 0) return new Map();
  const unique = [...new Set(userIds)];
  const rows = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(inArray(user.id, unique));
  return new Map(
    rows.map((row) => [row.id, { name: row.name, avatarUrl: row.image ?? null }]),
  );
}
