import { registerPort } from "./container.js";
import { blobStore } from "./blob-store.js";
import { attachmentReferences } from "../domains/attachments/service.js";
import { claimDueJobs } from "./claim-due-jobs.js";

let registered = false;

/** Registers default ports behind the messaging seams:
 * - `blobStore`: NotImplemented stub until ticket 16 lands (17 only ever calls
 *   getUrl/deleteObject, which it handles gracefully before the adapter exists).
 * - `attachmentReferences`: the real AttachmentReferences module (this ticket).
 * - `claimDueJobs`: NotImplemented stub until ticket 24 lands.
 * Feature tickets override via `registerPort` once real implementations land. */
export function registerDefaultPorts(): void {
  if (registered) return;
  registered = true;
  registerPort("blobStore", blobStore);
  registerPort("attachmentReferences", attachmentReferences);
  registerPort("claimDueJobs", claimDueJobs);
}

export * from "./container.js";
export type { BlobStore, AttachmentReferences, ClaimDueJobs } from "@denser/contracts";
