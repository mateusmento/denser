import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import type { ArtifactId, AttachmentId, SpaceId, UserId } from "@denser/contracts";
import { createBlobStore } from "./blob-store.js";
import { S3BlobStore, type S3BlobStoreOptions } from "./s3-blob-store.js";
import { sweepOrphanObjects } from "./orphan-sweep.js";
import type { AttachRowStore } from "./types.js";

const rootSpaceId = "11111111-1111-1111-1111-111111111111" as SpaceId;
const uploadedBy = "22222222-2222-2222-2222-222222222222" as UserId;
const conversationId = "33333333-3333-3333-3333-333333333333" as ArtifactId;

const uploadInput = {
  rootSpaceId,
  uploadedBy,
  conversationId,
  filename: "photo.png",
  mimeType: "image/png",
  byteSize: 2048,
};

function makeRowStore(): {
  store: AttachRowStore;
  created: Array<Record<string, unknown>>;
  deletedIds: string[];
  rows: Array<{ id: AttachmentId; storageKey: string }>;
} {
  let nextId = 1;
  const rows: Array<{ id: AttachmentId; storageKey: string }> = [];
  const created: Array<Record<string, unknown>> = [];
  const deletedIds: string[] = [];
  const store: AttachRowStore = {
    async create(input) {
      created.push({ ...input });
      const id = `att-${nextId++}` as AttachmentId;
      rows.push({ id, storageKey: input.storageKey });
      return { id };
    },
    async deleteById(id) {
      deletedIds.push(id);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows.splice(idx, 1);
    },
  };
  return { store, created, deletedIds, rows };
}

function makeS3Mock() {
  const sent: unknown[] = [];
  const client = {
    send: async (cmd: unknown) => {
      sent.push(cmd);
      if (cmd instanceof CreateMultipartUploadCommand) {
        return { UploadId: "upload-1" };
      }
      if (cmd instanceof UploadPartCommand) {
        return { ETag: `etag-${cmd.input.PartNumber}` };
      }
      return {};
    },
    destroy: async () => undefined,
  } as unknown;
  return { client, sent };
}

function makeStore(overrides: Partial<S3BlobStoreOptions> = {}) {
  const row = makeRowStore();
  const s3 = makeS3Mock();
  const store = new S3BlobStore(s3.client as never, row.store, {
    bucket: "bkt",
    folder: "uploads",
    ...overrides,
  });
  return { store, row, s3 };
}

test("happy path: createUpload + uploadPart + completeUpload returns attachmentId and storageKey", async () => {
  const { store, row, s3 } = makeStore();

  const created = await store.createUpload(uploadInput);
  assert.ok(created.attachmentId);
  assert.equal(created.upload.uploadId, "upload-1");
  assert.equal(row.created.length, 1);
  assert.equal(row.rows.length, 1);
  assert.equal(row.created[0]?.storageKey, row.rows[0]?.storageKey);

  const key = row.rows[0]!.storageKey;
  assert.ok(key.startsWith("uploads/"));
  assert.ok(key.endsWith("photo.png"));

  await store.uploadPart({
    uploadId: created.upload.uploadId,
    part: 1,
    data: new Uint8Array(4),
  });
  await store.uploadPart({
    uploadId: created.upload.uploadId,
    part: 2,
    data: new Uint8Array(4),
  });
  assert.equal(row.created[0]?.byteSize, uploadInput.byteSize);

  const complete = await store.completeUpload(created.upload.uploadId);
  assert.equal(complete.storageKey, key);

  const completeCmd = s3.sent.at(-1) as CompleteMultipartUploadCommand;
  const input = completeCmd.input as {
    MultipartUpload?: { Parts?: Array<{ PartNumber: number; ETag: string }> };
  };
  assert.deepEqual(input.MultipartUpload?.Parts, [
    { PartNumber: 1, ETag: "etag-1" },
    { PartNumber: 2, ETag: "etag-2" },
  ]);
});

test("abort cancels in-flight upload and best-effort deletes the seeded row", async () => {
  const { store, row, s3 } = makeStore();

  const created = await store.createUpload(uploadInput);
  assert.equal(row.rows.length, 1);

  await store.abortUpload(created.upload.uploadId);

  assert.equal(row.deletedIds.length, 1);
  assert.equal(row.deletedIds[0], created.attachmentId);
  assert.equal(row.rows.length, 0);
  const hasAbort = s3.sent.some((c) => c instanceof AbortMultipartUploadCommand);
  assert.equal(hasAbort, true);
});

test("uploadPart / completeUpload on unknown uploadId throws", async () => {
  const { store } = makeStore();
  await assert.rejects(
    store.uploadPart({ uploadId: "nope", part: 1, data: new Uint8Array(1) }),
    /No active upload session/,
  );
  await assert.rejects(store.completeUpload("nope"), /No active upload session/);
});

test("getUrl presigns when no public base url and returns public URL when configured", async () => {
  const signed = makeStore({
    signGetUrl: (key, expiresIn) => Promise.resolve(`signed:${key}:${expiresIn}`),
  });
  const presigned = await signed.store.getUrl("uploads/abc.png");
  assert.equal(presigned, "signed:uploads/abc.png:3600");

  const publicStore = makeStore({ publicBaseUrl: "https://pub.example.com/" });
  const publicUrl = await publicStore.store.getUrl("uploads/a b.png");
  assert.equal(publicUrl, "https://pub.example.com/uploads/a%20b.png");
});

test("deleteObject issues DeleteObjectCommand", async () => {
  const { store, s3 } = makeStore();
  await store.deleteObject("uploads/x.bin");
  assert.equal(
    s3.sent.some((c) => c instanceof DeleteObjectCommand),
    true,
  );
});

test("createBlobStore selects the s3 adapter by default and from env", () => {
  const row = makeRowStore();
  const s3Store = createBlobStore(row.store, "s3", {
    AWS_BUCKET: "bkt",
    S3_FOLDER: "uploads",
  });
  assert.ok(s3Store instanceof S3BlobStore);

  const fromEnv = createBlobStore(row.store, "s3", {
    AWS_BUCKET: "bkt",
  });
  assert.ok(fromEnv instanceof S3BlobStore);
});

test("createBlobStore throws when S3 env is missing", () => {
  const row = makeRowStore();
  assert.throws(
    () => createBlobStore(row.store, "s3", {}),
    /S3 blob store is not configured/,
  );
});

test("orphan sweep deletes only keys without a matching row", async () => {
  let deleted = 0;
  const result = await sweepOrphanObjects({
    listKeys: async () => ["a.bin", "b.bin", "c.bin"],
    hasRow: async (key) => key === "b.bin",
    deleteObject: async () => {
      deleted += 1;
    },
  });
  assert.equal(result.deleted, 2);
  assert.equal(deleted, 2);
});
