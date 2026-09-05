import type { AttachRowStore } from "./types.js";

/**
 * Orphan object sweep hook (ticket 16 A0).
 *
 * Storage keys present in the object store with no corresponding `attachments`
 * row are orphans (e.g. a cancelled upload that raced a crash). The full
 * reclaim / zero-reference GC lifecycle is owned by ticket 17
 * (AttachmentReferences.reclaim); this hook is the object-store half and may be
 * invoked independently to reconcile key ↔ row.
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
