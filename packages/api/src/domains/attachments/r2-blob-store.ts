import { S3Client } from "@aws-sdk/client-s3";
import type { BlobStore } from "@denser/contracts";
import type { R2BlobStoreConfig } from "./blob-store-env.js";
import { S3BlobStore, type S3BlobStoreOptions } from "./s3-blob-store.js";
import type { AttachRowStore } from "./types.js";

export type R2BlobStoreOptions = R2BlobStoreConfig;

/**
 * Cloudflare R2 `BlobStore` adapter. R2 exposes an S3-compatible API, so this
 * builds an S3 `S3Client` pointed at the R2 S3 endpoint and delegates to the
 * shared S3-compatible implementation. Same port surface as AWS S3.
 */
export function createR2BlobStore(
  rowStore: AttachRowStore,
  options: R2BlobStoreConfig,
): BlobStore {
  const client = new S3Client({
    region: "auto",
    endpoint: options.endpoint,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  });

  const s3Options: S3BlobStoreOptions = {
    bucket: options.bucket,
    folder: options.folder,
    ...(options.publicBaseUrl ? { publicBaseUrl: options.publicBaseUrl } : {}),
  };

  return new S3BlobStore(client, rowStore, s3Options);
}
