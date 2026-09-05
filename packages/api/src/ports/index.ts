import { createBlobStoreFromEnv } from "../domains/attachments/blob-store.js";
import { registerPort } from "./container.js";
import { blobStore } from "./blob-store.js";
import { attachmentReferences } from "./attachment-references.js";
import { claimDueJobs } from "./claim-due-jobs.js";

let registered = false;

/** Registers no-op / NotImplemented stubs behind the messaging ports.
 * Feature tickets override via `registerPort` once real implementations land. */
export function registerDefaultPorts(): void {
  if (registered) return;
  registered = true;
  // Ticket 16: register the real BlobStore adapter when blob env is configured,
  // otherwise keep the NotImplemented stub so the app boots without S3/R2.
  registerPort("blobStore", process.env.BLOB_STORE_BUCKET ? createBlobStoreFromEnv() : blobStore);
  registerPort("attachmentReferences", attachmentReferences);
  registerPort("claimDueJobs", claimDueJobs);
}

export * from "./container.js";
export type { BlobStore, AttachmentReferences, ClaimDueJobs } from "@denser/contracts";
