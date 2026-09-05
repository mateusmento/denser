import { createBlobStoreFromEnv, isBlobStoreConfigured } from "../domains/attachments/blob-store.js";
import { createEphemeralStoresFromEnvAsync } from "../domains/ephemeral/ephemeral-store-env.js";
import { registerPort } from "./container.js";
import { blobStore } from "./blob-store.js";
import { attachmentReferences } from "../domains/attachments/service.js";
import { claimDueJobs } from "./claim-due-jobs.js";

let registered = false;

/** Registers default ports behind the messaging seams. */
export async function registerDefaultPorts(): Promise<void> {
  if (registered) return;
  registered = true;
  registerPort("blobStore", isBlobStoreConfigured() ? createBlobStoreFromEnv() : blobStore);
  registerPort("attachmentReferences", attachmentReferences);
  registerPort("claimDueJobs", claimDueJobs);

  const ephemeral = await createEphemeralStoresFromEnvAsync();
  registerPort("typingStore", ephemeral.typingStore);
  registerPort("presenceStore", ephemeral.presenceStore);
}

export * from "./container.js";
export type {
  BlobStore,
  AttachmentReferences,
  ClaimDueJobs,
  TypingStore,
  PresenceStore,
} from "@denser/contracts";
