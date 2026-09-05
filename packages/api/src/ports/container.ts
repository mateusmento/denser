import type { AttachmentReferences, BlobStore, ClaimDueJobs, PresenceStore, TypingStore } from "@denser/contracts";

type PortMap = {
  blobStore: BlobStore;
  attachmentReferences: AttachmentReferences;
  claimDueJobs: ClaimDueJobs;
  typingStore: TypingStore;
  presenceStore: PresenceStore;
};

const ports: Partial<PortMap> = {};

export function registerPort<K extends keyof PortMap>(key: K, implementation: PortMap[K]): void {
  ports[key] = implementation;
}

export function getPort<K extends keyof PortMap>(key: K): PortMap[K] {
  const implementation = ports[key];
  if (!implementation) {
    throw new Error(`Port ${key} is not registered`);
  }
  return implementation;
}

export function hasPort<K extends keyof PortMap>(key: K): boolean {
  return ports[key] != null;
}

export type { PortMap };
