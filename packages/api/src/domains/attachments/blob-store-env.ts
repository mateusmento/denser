export type S3BlobStoreConfig = {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  folder: string;
  /** Omitted for standard AWS S3 — the SDK resolves the regional endpoint. */
  endpoint?: string;
  /** Virtual-hosted public URL prefix when the bucket allows un-signed reads. */
  publicBaseUrl?: string;
};

export type R2BlobStoreConfig = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  folder: string;
  endpoint: string;
  publicBaseUrl?: string;
};

/**
 * `BlobStore` adapter selection. `BLOB_STORE_ADAPTER=s3|r2` picks the
 * implementation; both are injected as a single `BlobStore` behind the port
 * container (`registerPort("blobStore", ...)` — see `.scratch/messaging/interfaces.md`).
 */
export type BlobStoreAdapterName = "s3" | "r2";

export function resolveBlobStoreAdapter(
  env: NodeJS.ProcessEnv = process.env,
): BlobStoreAdapterName {
  const raw = env.BLOB_STORE_ADAPTER?.trim().toLowerCase();
  return raw === "r2" ? "r2" : "s3";
}

export function inferS3PublicBaseUrl(bucket: string, region: string): string {
  const normalized = region.trim() || "us-east-1";
  if (normalized === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com`;
  }
  return `https://${bucket}.s3.${normalized}.amazonaws.com`;
}

export function inferR2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function extractR2AccountId(endpoint: string): string | undefined {
  const match = /https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/.exec(endpoint.trim());
  return match?.[1];
}

export function parseS3BlobStoreEnv(
  env: NodeJS.ProcessEnv = process.env,
): S3BlobStoreConfig | null {
  const bucket = readEnv(env, "AWS_BUCKET", "S3_BUCKET", "BLOB_STORE_BUCKET");
  if (!bucket) return null;

  const region = readEnv(env, "AWS_REGION", "S3_REGION", "BLOB_STORE_REGION") ?? "us-east-1";
  const accessKeyId = readEnv(
    env,
    "AWS_ACCESS_KEY_ID",
    "S3_ACCESS_KEY_ID",
    "BLOB_STORE_ACCESS_KEY_ID",
  );
  const secretAccessKey = readEnv(
    env,
    "AWS_SECRET_ACCESS_KEY",
    "S3_SECRET_ACCESS_KEY",
    "BLOB_STORE_SECRET_ACCESS_KEY",
  );
  const folder = readEnv(env, "S3_FOLDER", "BLOB_STORE_FOLDER") ?? "uploads";
  const endpoint = readEnv(env, "S3_ENDPOINT", "AWS_ENDPOINT", "BLOB_STORE_ENDPOINT");
  const publicBaseUrl =
    readEnv(env, "S3_PUBLIC_BASE_URL", "AWS_PUBLIC_BASE_URL", "BLOB_STORE_PUBLIC_BASE_URL") ??
    inferS3PublicBaseUrl(bucket, region);

  return {
    bucket,
    region,
    folder,
    ...(accessKeyId ? { accessKeyId } : {}),
    ...(secretAccessKey ? { secretAccessKey } : {}),
    ...(endpoint ? { endpoint } : {}),
    ...(publicBaseUrl ? { publicBaseUrl } : {}),
  };
}

export function parseR2BlobStoreEnv(
  env: NodeJS.ProcessEnv = process.env,
): R2BlobStoreConfig | null {
  const bucket = readEnv(env, "R2_BUCKET");
  const accessKeyId = readEnv(env, "R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv(env, "R2_SECRET_ACCESS_KEY");
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const accountId =
    readEnv(env, "R2_ACCOUNT_ID") ?? extractR2AccountId(readEnv(env, "R2_ENDPOINT") ?? "");
  if (!accountId) return null;

  const folder = readEnv(env, "R2_FOLDER", "BLOB_STORE_FOLDER") ?? "uploads";
  const endpoint = readEnv(env, "R2_ENDPOINT") ?? inferR2Endpoint(accountId);
  const publicBaseUrl = readEnv(env, "R2_PUBLIC_BASE_URL");

  return {
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
    folder,
    endpoint,
    ...(publicBaseUrl ? { publicBaseUrl } : {}),
  };
}

export function isBlobStoreConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveBlobStoreAdapter(env) === "r2"
    ? parseR2BlobStoreEnv(env) != null
    : parseS3BlobStoreEnv(env) != null;
}

function readEnv(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}
