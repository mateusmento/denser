import type { BlobStore } from "@denser/contracts";

export class NotImplementedBlobStore implements BlobStore {
  createUpload(): Promise<never> {
    return Promise.reject(
      new Error("BlobStore.createUpload: not configured (set BLOB_STORE_* env)"),
    );
  }

  abortUpload(): Promise<never> {
    return Promise.reject(
      new Error("BlobStore.abortUpload: not configured (set BLOB_STORE_* env)"),
    );
  }

  completeUpload(): Promise<never> {
    return Promise.reject(
      new Error("BlobStore.completeUpload: not configured (set BLOB_STORE_* env)"),
    );
  }

  getUrl(): Promise<never> {
    return Promise.reject(new Error("BlobStore.getUrl: not configured (set BLOB_STORE_* env)"));
  }

  deleteObject(): Promise<never> {
    return Promise.reject(
      new Error("BlobStore.deleteObject: not configured (set BLOB_STORE_* env)"),
    );
  }
}

export const blobStore = new NotImplementedBlobStore();
