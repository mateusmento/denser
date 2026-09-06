const RECORDINGS_DIR = "screen-recordings";

export type RecordingChunkSink = {
  append: (chunk: Blob) => void;
  finalize: () => Promise<File>;
  abort: () => Promise<void>;
};

export function isOpfsRecordingSupported(): boolean {
  return typeof navigator.storage?.getDirectory === "function";
}

type OpfsDirectoryHandle = FileSystemDirectoryHandle & {
  keys(): AsyncIterableIterator<string>;
};

async function getRecordingsDirectory(): Promise<OpfsDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(RECORDINGS_DIR, { create: true }) as Promise<OpfsDirectoryHandle>;
}

export async function clearStaleOpfsRecordings(): Promise<void> {
  if (!isOpfsRecordingSupported()) return;

  try {
    const dir = await getRecordingsDirectory();
    for await (const name of dir.keys()) {
      if (name.endsWith(".webm")) {
        await dir.removeEntry(name);
      }
    }
  } catch {
    // Best-effort cleanup only.
  }
}

type OpfsRecordingSink = RecordingChunkSink & {
  fileName: string;
};

async function createOpfsRecordingChunkSink(
  mimeType: string,
  filename: string,
): Promise<OpfsRecordingSink> {
  await clearStaleOpfsRecordings();

  const dir = await getRecordingsDirectory();
  const fileName = `${crypto.randomUUID()}.webm`;
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  let writeChain = Promise.resolve();
  let closed = false;

  const closeWritable = async () => {
    if (closed) return;
    closed = true;
    await writeChain;
    await writable.close();
  };

  return {
    fileName,
    append(chunk: Blob) {
      if (closed || chunk.size === 0) return;
      writeChain = writeChain.then(() => writable.write(chunk));
    },
    async finalize() {
      await closeWritable();
      const persisted = await fileHandle.getFile();
      if (persisted.size === 0) {
        await dir.removeEntry(fileName);
        throw new Error("Recording is empty");
      }
      if (persisted.name === filename && persisted.type === mimeType) {
        return persisted;
      }
      return new File([persisted], filename, {
        type: mimeType,
        lastModified: persisted.lastModified,
      });
    },
    async abort() {
      await closeWritable();
      try {
        await dir.removeEntry(fileName);
      } catch {
        // File may already be gone.
      }
    },
  };
}

function createMemoryRecordingChunkSink(mimeType: string, filename: string): RecordingChunkSink {
  const chunks: BlobPart[] = [];

  return {
    append(chunk: Blob) {
      if (chunk.size > 0) chunks.push(chunk);
    },
    async finalize() {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) throw new Error("Recording is empty");
      return new File([blob], filename, { type: mimeType });
    },
    async abort() {
      chunks.length = 0;
    },
  };
}

export async function createRecordingChunkSink(
  mimeType: string,
  filename: string,
): Promise<RecordingChunkSink> {
  if (isOpfsRecordingSupported()) {
    try {
      return await createOpfsRecordingChunkSink(mimeType, filename);
    } catch {
      // Fall back when OPFS is advertised but unavailable (private mode, policy, etc.).
    }
  }
  return createMemoryRecordingChunkSink(mimeType, filename);
}
