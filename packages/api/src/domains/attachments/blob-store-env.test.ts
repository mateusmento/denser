import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inferR2Endpoint,
  inferS3PublicBaseUrl,
  isBlobStoreConfigured,
  parseR2BlobStoreEnv,
  parseS3BlobStoreEnv,
  resolveBlobStoreAdapter,
} from "./blob-store-env.js";

test("parseS3BlobStoreEnv reads AWS_* and infers the public base URL", () => {
  const config = parseS3BlobStoreEnv({
    AWS_REGION: "sa-east-1",
    AWS_ACCESS_KEY_ID: "key",
    AWS_SECRET_ACCESS_KEY: "secret",
    AWS_BUCKET: "my-bucket",
    S3_FOLDER: "attachments",
  });

  assert.deepEqual(config, {
    bucket: "my-bucket",
    region: "sa-east-1",
    accessKeyId: "key",
    secretAccessKey: "secret",
    folder: "attachments",
    publicBaseUrl: "https://my-bucket.s3.sa-east-1.amazonaws.com",
  });
});

test("parseS3BlobStoreEnv uses the us-east-1 public URL shape", () => {
  const config = parseS3BlobStoreEnv({
    AWS_BUCKET: "my-bucket",
    AWS_REGION: "us-east-1",
  });

  assert.equal(config?.publicBaseUrl, "https://my-bucket.s3.amazonaws.com");
});

test("parseR2BlobStoreEnv reads R2_* and infers the S3-compatible endpoint", () => {
  const config = parseR2BlobStoreEnv({
    R2_ACCOUNT_ID: "acct-123",
    R2_BUCKET: "uploads",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_PUBLIC_BASE_URL: "https://pub.example.r2.dev",
  });

  assert.deepEqual(config, {
    accountId: "acct-123",
    bucket: "uploads",
    accessKeyId: "key",
    secretAccessKey: "secret",
    folder: "uploads",
    endpoint: "https://acct-123.r2.cloudflarestorage.com",
    publicBaseUrl: "https://pub.example.r2.dev",
  });
});

test("isBlobStoreConfigured respects the selected adapter", () => {
  assert.equal(
    isBlobStoreConfigured({
      BLOB_STORE_ADAPTER: "s3",
      AWS_BUCKET: "bucket",
    }),
    true,
  );
  assert.equal(
    isBlobStoreConfigured({
      BLOB_STORE_ADAPTER: "r2",
      AWS_BUCKET: "bucket",
    }),
    false,
  );
  assert.equal(
    isBlobStoreConfigured({
      BLOB_STORE_ADAPTER: "r2",
      R2_ACCOUNT_ID: "acct",
      R2_BUCKET: "bucket",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
    }),
    true,
  );
});

test("resolveBlobStoreAdapter defaults to s3", () => {
  assert.equal(resolveBlobStoreAdapter({}), "s3");
  assert.equal(resolveBlobStoreAdapter({ BLOB_STORE_ADAPTER: "r2" }), "r2");
});

test("inferR2Endpoint builds the Cloudflare endpoint", () => {
  assert.equal(inferR2Endpoint("acct-123"), "https://acct-123.r2.cloudflarestorage.com");
});

test("inferS3PublicBaseUrl handles regional buckets", () => {
  assert.equal(
    inferS3PublicBaseUrl("files", "eu-west-1"),
    "https://files.s3.eu-west-1.amazonaws.com",
  );
});
