import type { UserId } from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { user } from "../../db/schema/auth.js";

export type UserTimezoneRow = {
  timezone: string | null;
  timezoneSource: "auto" | "manual";
};

export async function findUserTimezone(userId: UserId): Promise<UserTimezoneRow | undefined> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { timezone: true, timezoneSource: true },
  });
  return row ?? undefined;
}

export async function updateUserTimezone(
  userId: UserId,
  input: { timezone: string; timezoneSource?: "auto" | "manual" },
): Promise<UserTimezoneRow | undefined> {
  const [updated] = await db
    .update(user)
    .set({
      timezone: input.timezone,
      ...(input.timezoneSource !== undefined ? { timezoneSource: input.timezoneSource } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({ timezone: user.timezone, timezoneSource: user.timezoneSource });
  return updated ?? undefined;
}
