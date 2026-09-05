import type { BlobStore } from "@denser/contracts";

export class NotImplementedBlobStore implements BlobStore {
  createUpload(): Promise<never> {
    return Promise.reject(new Error("BlobStore.createUpload: not implemented (ticket 06)"));
  }

  abortUpload(): Promise<never> {
    return Promise.reject(new Error("BlobStore.abortUpload: not implemented (ticket 06)"));
  }

  completeUpload(): Promise<never> {
    return Promise.reject(new Error("BlobStore.completeUpload: not implemented (ticket 06)"));
  }

  getUrl(): Promise<never> {
    return Promise.reject(new Error("BlobStore.getUrl: not implemented (ticket 06)"));
  }

  deleteObject(): Promise<never> {
    return Promise.reject(new Error("BlobStore.deleteObject: not implemented (ticket 06)"));
  }
}

export const blobStore = new NotImplementedBlobStore();
