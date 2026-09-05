import { getPort } from "../../ports/container.js";
import { db } from "../../db/client.js";
import { attachment } from "../../db/schema/attachment.js";
import { inArray } from "drizzle-orm";
import type { AttachRowStore } from "./types.js";

/**
 * Orphan object sweep (ATTACHMENTS.md "Maintenance"), named to be distinct from the
 * join-refcount `reclaim`: deletes object-store keys that have **no** attachment row.
 *
 * The `BlobStore` port does not expose an object-listing operation, so the caller
 * (the hourly cron) supplies the current set of storage keys from the adapter. This
 * module performs the DB side — the "key has no row" decision — and the object
 * deletes via the `blobStore` port.
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

/**
 * Orphan object sweep hook (ticket 16 A0) — object-store side.
 *
 * Storage keys present in the object store with no corresponding `attachments`
 * row are orphans (e.g. a cancelled upload that raced a crash). The zero-reference
 * GC lifecycle is owned by ticket 17 (AttachmentReferences.reclaim); this hook is
 * the object-store half and may be invoked independently to reconcile key ↔ row.
 */
export async function sweepOrphanObjects(input: {
  listKeys: () => Promise<string[]>;
  hasRow: (storageKey: string) => Promise<boolean>;
  deleteObject: (storageKey: string) => Promise<void>;
}): Promise<{ deleted: number }> {
  let deleted = 0;
  for (const key of await input.listKeys()) {
    const exists = await input.hasRow(key);
    if (!exists) {
      await input.deleteObject(key);
      deleted += 1;
    }
  }
  return { deleted };
}

export type { AttachRowStore };
