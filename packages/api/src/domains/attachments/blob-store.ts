import { S3Client } from "@aws-sdk/client-s3";
import type { BlobStore } from "@denser/contracts";
import type { BlobStoreAdapterName } from "./blob-store-env.js";
import {
  isBlobStoreConfigured,
  parseR2BlobStoreEnv,
  parseS3BlobStoreEnv,
  resolveBlobStoreAdapter,
  type R2BlobStoreConfig,
  type S3BlobStoreConfig,
} from "./blob-store-env.js";
import { createR2BlobStore } from "./r2-blob-store.js";
import { S3BlobStore } from "./s3-blob-store.js";
import type { AttachRowStore } from "./types.js";

const defaultRowStore: AttachRowStore = {
  async create(input) {
    const { insertAttachmentRow } = await import("./repository.js");
    const row = await insertAttachmentRow(input);
    return { id: row.id };
  },
  async deleteById(id) {
    const { deleteAttachmentRow } = await import("./repository.js");
    await deleteAttachmentRow(id);
  },
};

export function createS3BlobStore(rowStore: AttachRowStore, config: S3BlobStoreConfig): BlobStore {
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    ...(config.accessKeyId && config.secretAccessKey
      ? {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }
      : {}),
  });

  return new S3BlobStore(client, rowStore, {
    bucket: config.bucket,
    folder: config.folder,
    ...(config.publicBaseUrl ? { publicBaseUrl: config.publicBaseUrl } : {}),
  });
}

/** Build the configured BlobStore from parsed adapter config. */
export function createBlobStore(
  rowStore: AttachRowStore,
  adapter: BlobStoreAdapterName,
  env: NodeJS.ProcessEnv = process.env,
): BlobStore {
  switch (adapter) {
    case "r2": {
      const config = parseR2BlobStoreEnv(env);
      if (!config) {
        throw new Error(
          "R2 blob store is not configured (set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)",
        );
      }
      return createR2BlobStore(rowStore, config);
    }
    case "s3":
    default: {
      const config = parseS3BlobStoreEnv(env);
      if (!config) {
        throw new Error("S3 blob store is not configured (set AWS_BUCKET and AWS_REGION)");
      }
      return createS3BlobStore(rowStore, config);
    }
  }
}

/** Build a BlobStore from process.env (dotenv) for app bootstrap. */
export function createBlobStoreFromEnv(env: NodeJS.ProcessEnv = process.env): BlobStore {
  return createBlobStore(defaultRowStore, resolveBlobStoreAdapter(env), env);
}

export { defaultRowStore, isBlobStoreConfigured };
export type { AttachRowStore, BlobStoreAdapterName, R2BlobStoreConfig, S3BlobStoreConfig };
