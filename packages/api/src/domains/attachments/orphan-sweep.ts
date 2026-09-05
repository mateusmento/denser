import { getPort } from "../../ports/container.js";
import { db } from "../../db/client.js";
import { attachment } from "../../db/schema/attachment.js";
import { inArray } from "drizzle-orm";

/**
 * Orphan object sweep (ATTACHMENTS.md "Maintenance"), named to be distinct from the
 * join-refcount `reclaim`: deletes object-store keys that have **no** attachment row.
 *
 * The `BlobStore` port does not expose an object-listing operation, so the caller
 * (the hourly cron, once ticket 16 lands) supplies the current set of storage keys
 * from the adapter. This module performs the DB side — the "key has no row" decision —
 * and the object deletes via the `blobStore` port.
 */
export async function orphanSweep(storageKeys: readonly string[]): Promise<void> {
  if (storageKeys.length === 0) return;

  const rows = await db
    .select({ storageKey: attachment.storageKey })
    .from(attachment)
    .where(inArray(attachment.storageKey, storageKeys));

  const known = new Set(rows.map((r) => r.storageKey));
  const orphans = storageKeys.filter((key) => !known.has(key));

  for (const key of orphans) {
    try {
      await getPort("blobStore").deleteObject(key);
    } catch {
      // Best-effort; the next sweep retries.
    }
  }
}
