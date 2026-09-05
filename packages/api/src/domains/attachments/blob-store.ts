import { S3Client } from "@aws-sdk/client-s3";
import type { BlobStore } from "@denser/contracts";
import { createR2BlobStore } from "./r2-blob-store.js";
import { S3BlobStore } from "./s3-blob-store.js";
import type { AttachRowStore } from "./types.js";

/**
 * `BlobStore` adapter selection. `BLOB_STORE_ADAPTER=s3|r2` picks the
 * implementation; both are injected as a single `BlobStore` behind the port
 * container (`registerPort("blobStore", ...)` — see `.scratch/messaging/interfaces.md`).
 */
export type BlobStoreAdapterName = "s3" | "r2";

export type BlobStoreEnv = {
  adapter?: BlobStoreAdapterName;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  folder?: string;
  /** Un-signed public URL prefix for a public bucket (S3 or R2). */
  publicBaseUrl?: string;
};

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

/** Build the configured BlobStore from parsed env. Throws on unknown adapter. */
export function createBlobStore(rowStore: AttachRowStore, env: BlobStoreEnv): BlobStore {
  const adapter: BlobStoreAdapterName = env.adapter ?? "s3";
  if (!env.bucket) {
    throw new Error("BLOB_STORE_BUCKET is required to construct a BlobStore");
  }

  switch (adapter) {
    case "r2": {
      const accountId = env.endpoint ? extractR2AccountId(env.endpoint) : undefined;
      if (!accountId) {
        throw new Error(
          "R2 adapter requires BLOB_STORE_ENDPOINT containing the account id " +
            "(https://<accountId>.r2.cloudflarestorage.com)",
        );
      }
      return createR2BlobStore(rowStore, {
        accountId,
        accessKeyId: env.accessKeyId ?? "",
        secretAccessKey: env.secretAccessKey ?? "",
        bucket: env.bucket,
        ...(env.folder ? { folder: env.folder } : {}),
        ...(env.publicBaseUrl ? { publicBaseUrl: env.publicBaseUrl } : {}),
      });
    }
    case "s3":
    default: {
      const clientArgs: ConstructorParameters<typeof S3Client>[0] = {
        region: env.region ?? "us-east-1",
        ...(env.endpoint ? { endpoint: env.endpoint } : {}),
        ...(env.accessKeyId && env.secretAccessKey
          ? {
              credentials: {
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey,
              },
            }
          : {}),
      };
      const client = new S3Client(clientArgs);
      return new S3BlobStore(client, rowStore, {
        bucket: env.bucket,
        ...(env.folder ? { folder: env.folder } : {}),
        ...(env.publicBaseUrl ? { publicBaseUrl: env.publicBaseUrl } : {}),
      });
    }
  }
}

/** Build a BlobStore from process.env (dotenv) for app bootstrap. */
export function createBlobStoreFromEnv(env: NodeJS.ProcessEnv = process.env): BlobStore {
  return createBlobStore(defaultRowStore, {
    adapter: (env.BLOB_STORE_ADAPTER as BlobStoreAdapterName | undefined) ?? "s3",
    bucket: env.BLOB_STORE_BUCKET ?? "",
    ...(env.BLOB_STORE_ENDPOINT ? { endpoint: env.BLOB_STORE_ENDPOINT } : {}),
    ...(env.BLOB_STORE_REGION ? { region: env.BLOB_STORE_REGION } : {}),
    ...(env.BLOB_STORE_ACCESS_KEY_ID ? { accessKeyId: env.BLOB_STORE_ACCESS_KEY_ID } : {}),
    ...(env.BLOB_STORE_SECRET_ACCESS_KEY
      ? { secretAccessKey: env.BLOB_STORE_SECRET_ACCESS_KEY }
      : {}),
    ...(env.BLOB_STORE_FOLDER ? { folder: env.BLOB_STORE_FOLDER } : {}),
    ...(env.BLOB_STORE_PUBLIC_BASE_URL ? { publicBaseUrl: env.BLOB_STORE_PUBLIC_BASE_URL } : {}),
  });
}

export { defaultRowStore };
export type { AttachRowStore };

function extractR2AccountId(endpoint: string): string | undefined {
  const match = /https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/.exec(endpoint);
  return match ? match[1] : undefined;
}
