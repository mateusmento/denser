import type { ApiClient } from "@denser/api-client";
import type { ArtifactId, AttachmentDto, MessageId } from "@denser/contracts";

const CHUNK_SIZE = 5 * 1024 * 1024;

export type ConversationUploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type ConversationUploadOptions = {
  threadId?: MessageId | null;
  onProgress?: (progress: ConversationUploadProgress) => void;
  signal?: AbortSignal;
};

export class ConversationUploadAbortError extends Error {
  constructor() {
    super("Upload aborted");
    this.name = "ConversationUploadAbortError";
  }
}

function reportProgress(
  loaded: number,
  total: number,
  onProgress?: ConversationUploadOptions["onProgress"],
) {
  onProgress?.({
    loaded,
    total,
    percent: total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100,
  });
}

export async function uploadConversationFile(
  client: ApiClient,
  conversationId: ArtifactId,
  file: File,
  options: ConversationUploadOptions = {},
): Promise<AttachmentDto> {
  const mimeType = file.type || "application/octet-stream";
  const started = await client.startConversationUpload(conversationId, {
    filename: file.name,
    mimeType,
    byteSize: file.size,
    ...(options.threadId ? { threadId: options.threadId } : {}),
  });

  const totalParts = Math.max(1, Math.ceil(file.size / CHUNK_SIZE) || 1);
  let loaded = 0;

  try {
    for (let part = 1; part <= totalParts; part++) {
      if (options.signal?.aborted) {
        throw new ConversationUploadAbortError();
      }

      const start = (part - 1) * CHUNK_SIZE;
      const chunk = file.size === 0 ? file.slice(0, 0) : file.slice(start, start + CHUNK_SIZE);
      const buffer = new Uint8Array(await chunk.arrayBuffer());
      await client.uploadConversationPart(conversationId, started.uploadId, part, buffer);
      loaded += buffer.byteLength;
      reportProgress(loaded, file.size, options.onProgress);
    }

    const { attachment } = await client.completeConversationUpload(
      conversationId,
      started.uploadId,
    );
    return attachment;
  } catch (error) {
    if (!(error instanceof ConversationUploadAbortError)) {
      throw error;
    }
    try {
      await client.abortConversationUpload(conversationId, started.uploadId);
    } catch {
      /* best-effort cleanup */
    }
    throw error;
  }
}
