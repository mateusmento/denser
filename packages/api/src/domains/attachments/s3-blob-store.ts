import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ArtifactId, AttachmentId, BlobStore, SpaceId, UserId } from "@denser/contracts";
import { randomBytes } from "node:crypto";
import type { AttachRowStore, UploadPartRecord } from "./types.js";

export type S3BlobStoreOptions = {
  bucket: string;
  folder?: string;
  expiresIn?: number;
  /** When set, `getUrl` returns an un-signed URL against a public bucket instead of presigning. */
  publicBaseUrl?: string;
  /** Presigner seam (defaults to `@aws-sdk/s3-request-presigner`). Injectable for tests. */
  signGetUrl?: (storageKey: string, expiresIn: number) => Promise<string>;
};

type ActiveUpload = {
  uploadId: string;
  storageKey: string;
  attachmentId: AttachmentId;
  parts: UploadPartRecord[];
};

/**
 * S3-compatible `BlobStore` adapter. AWS S3 and Cloudflare R2 both speak the S3
 * API surface used here; an R2 adapter points the same S3 SDK at the R2 endpoint
 * / public bucket and reuses this implementation.
 *
 * Progressive multipart: `createUpload` starts a multipart session and seeds the
 * `attachments` row; `uploadPart` buffers part metadata in-memory per session;
 * `completeUpload` finalises with the collected parts; `abortUpload` cancels the
 * in-flight multipart and best-effort removes the seeded row.
 *
 * Objects are deleted via `deleteObject` only after GC / orphan sweep decide a
 * blob has no remaining references (ticket 17). Vendor URLs are never the
 * source of truth: callers return `attachmentId` + `getUrl(storageKey)`.
 */
export class S3BlobStore implements BlobStore {
  private readonly bucket: string;
  private readonly folder: string;
  private readonly expiresIn: number;
  private readonly publicBaseUrl: string | undefined;
  private readonly signGetUrl: (storageKey: string, expiresIn: number) => Promise<string>;
  private readonly uploads = new Map<string, ActiveUpload>();

  constructor(
    private readonly client: S3Client,
    private readonly rowStore: AttachRowStore,
    options: S3BlobStoreOptions,
  ) {
    this.bucket = options.bucket;
    this.folder = options.folder ?? "";
    this.expiresIn = options.expiresIn ?? 3600;
    this.publicBaseUrl = options.publicBaseUrl;
    this.signGetUrl = options.signGetUrl ?? defaultPresign(this.client, this.bucket);
  }

  async createUpload(input: {
    rootSpaceId: SpaceId;
    uploadedBy: UserId;
    filename: string;
    mimeType: string;
    byteSize: number;
    conversationId?: ArtifactId | null;
  }): Promise<{ attachmentId: AttachmentId; upload: { uploadId: string } }> {
    const storageKey = this.buildStorageKey(input.rootSpaceId, input.filename);

    const row = await this.rowStore.create({
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId ?? null,
      uploadedBy: input.uploadedBy,
      storageKey,
      mimeType: input.mimeType,
      originalFilename: input.filename,
      byteSize: input.byteSize,
    });

    try {
      const created = await this.client.send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: storageKey,
          ContentType: input.mimeType,
        }),
      );
      const uploadId = created.UploadId;
      if (!uploadId) {
        throw new Error("S3 did not return an UploadId for multipart upload");
      }
      this.uploads.set(uploadId, {
        uploadId,
        storageKey,
        attachmentId: row.id,
        parts: [],
      });
      return { attachmentId: row.id, upload: { uploadId } };
    } catch (error) {
      await this.rowStore.deleteById(row.id).catch(() => undefined);
      throw error;
    }
  }

  async uploadPart(input: { uploadId: string; part: number; data: Uint8Array }): Promise<void> {
    const active = this.getActiveUpload(input.uploadId);
    const uploaded = await this.client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: active.storageKey,
        UploadId: input.uploadId,
        PartNumber: input.part,
        Body: input.data,
      }),
    );
    if (!uploaded.ETag) {
      throw new Error(`S3 did not return an ETag for part ${input.part}`);
    }
    active.parts.push({ partNumber: input.part, etag: uploaded.ETag });
  }

  async completeUpload(uploadId: string): Promise<{ storageKey: string }> {
    const active = this.getActiveUpload(uploadId);
    const parts: CompletedPart[] = active.parts.map((part) => ({
      PartNumber: part.partNumber,
      ETag: part.etag,
    }));
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: active.storageKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
    this.uploads.delete(uploadId);
    return { storageKey: active.storageKey };
  }

  async abortUpload(uploadId: string): Promise<void> {
    const active = this.getActiveUpload(uploadId);
    this.uploads.delete(uploadId);
    await this.client
      .send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: active.storageKey,
          UploadId: uploadId,
        }),
      )
      .catch(() => undefined);
    await this.rowStore.deleteById(active.attachmentId).catch(() => undefined);
  }

  async getUrl(storageKey: string): Promise<string> {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, "")}/${encodeKey(storageKey)}`;
    }
    return this.signGetUrl(storageKey, this.expiresIn);
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  /** List object keys under this bucket/prefix (used by the orphan sweep). */
  async listObjectKeys(): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.folder || undefined,
          ContinuationToken: token,
        }),
      );
      for (const obj of page.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      token = page.NextContinuationToken;
    } while (token);
    return keys;
  }

  private getActiveUpload(uploadId: string): ActiveUpload {
    const active = this.uploads.get(uploadId);
    if (!active) {
      throw new Error(`No active upload session for uploadId ${uploadId}`);
    }
    return active;
  }

  private buildStorageKey(rootSpaceId: SpaceId, filename: string): string {
    const random = randomBytes(16).toString("hex");
    const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_");
    const prefix = this.folder ? `${this.folder}/` : "";
    return `${prefix}${rootSpaceId}/${random}-${safeName}`;
  }
}

function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function defaultPresign(client: S3Client, bucket: string) {
  return (storageKey: string, expiresIn: number) =>
    getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: storageKey }), { expiresIn });
}
