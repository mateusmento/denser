import type { AttachmentId } from "@denser/contracts";
import type { JSONContent } from "@/modules/rich-text";

/** Reads `attachmentId` from inline image nodes in a TipTap doc. */
export function collectImageAttachmentIdsFromDoc(
  doc: JSONContent | null | undefined,
): AttachmentId[] {
  const ids = new Set<AttachmentId>();

  function walk(node: JSONContent | undefined): void {
    if (!node) return;
    if (node.type === "image") {
      const aid = node.attrs?.attachmentId;
      if (typeof aid === "string" && aid.length > 0) {
        ids.add(aid as AttachmentId);
      }
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  walk(doc ?? undefined);
  return [...ids];
}

export function docContainsImageNodes(doc: JSONContent | null | undefined): boolean {
  let found = false;

  function walk(node: JSONContent | undefined): void {
    if (!node || found) return;
    if (node.type === "image") {
      found = true;
      return;
    }
    if (node.content) {
      for (const child of node.content) walk(child);
    }
  }

  walk(doc ?? undefined);
  return found;
}
