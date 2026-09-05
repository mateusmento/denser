import { S3Client } from "@aws-sdk/client-s3";
import type { BlobStore } from "@denser/contracts";
import { S3BlobStore, type S3BlobStoreOptions } from "./s3-blob-store.js";
import type { AttachRowStore } from "./types.js";

export type R2BlobStoreOptions = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  folder?: string;
  expiresIn?: number;
  /** R2 public bucket URL (e.g. https://pub-xxxx.r2.dev) for un-signed URLs. */
  publicBaseUrl?: string;
};

/**
 * Cloudflare R2 `BlobStore` adapter. R2 exposes an S3-compatible API, so this
 * builds an S3 `S3Client` pointed at the R2 S3 endpoint and delegates to the
 * shared S3-compatible implementation. Same port surface as AWS S3.
 */
export function createR2BlobStore(
  rowStore: AttachRowStore,
  options: R2BlobStoreOptions,
): BlobStore {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  });

  const s3Options: S3BlobStoreOptions = {
    bucket: options.bucket,
    ...(options.folder ? { folder: options.folder } : {}),
    ...(options.expiresIn ? { expiresIn: options.expiresIn } : {}),
    ...(options.publicBaseUrl ? { publicBaseUrl: options.publicBaseUrl } : {}),
  };

  return new S3BlobStore(client, rowStore, s3Options);
}
