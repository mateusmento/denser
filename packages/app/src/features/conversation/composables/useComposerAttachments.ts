import type { ArtifactId, AttachmentDto, AttachmentId, MessageId } from "@denser/contracts";
import { ApiMessageDraftConflictError } from "@denser/api-client";
import { computed, shallowRef, watch } from "vue";
import { apiClient } from "@/lib/api";
import {
  ConversationUploadAbortError,
  uploadConversationFile,
} from "@/lib/upload/conversation-upload";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { emptyDoc, type JSONContent } from "@/modules/rich-text";
import { collectImageAttachmentIdsFromDoc, docContainsImageNodes } from "../lib/collect-image-attachment-ids";
import type { ComposerAttachmentTileView, ComposerAttachmentsView } from "../types";

type PendingTransfer =
  | {
      clientId: string;
      status: "uploading";
      file: File;
      previewUrl: string;
      progress: number;
      abort: () => void;
    }
  | {
      clientId: string;
      status: "failed";
      file: File;
      previewUrl: string;
      message?: string;
    };

function revokePreviewUrls(entries: PendingTransfer[]) {
  for (const entry of entries) {
    URL.revokeObjectURL(entry.previewUrl);
  }
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function useComposerAttachments(options: {
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>;
  threadId?: ReadonlyRefOrGetter<MessageId | null | undefined>;
  body: ReadonlyRefOrGetter<JSONContent>;
  disabled?: ReadonlyRefOrGetter<boolean>;
}) {
  const conversationId = toReadonlyRef(options.conversationId);
  const threadId = toReadonlyRef(options.threadId ?? (() => null));
  const body = toReadonlyRef(options.body);
  const disabled = toReadonlyRef(options.disabled ?? (() => false));

  const staged = shallowRef<AttachmentDto[]>([]);
  const pending = shallowRef<PendingTransfer[]>([]);
  const draftVersion = shallowRef(0);

  const inlineAttachmentIds = computed(() => collectImageAttachmentIdsFromDoc(body.value));

  const visibleStaged = computed(() =>
    staged.value.filter((attachment) => !inlineAttachmentIds.value.includes(attachment.id)),
  );

  const tiles = computed((): ComposerAttachmentTileView[] => {
    const transferRows: ComposerAttachmentTileView[] = pending.value.map((entry) =>
      entry.status === "uploading"
        ? {
            key: `t:${entry.clientId}`,
            kind: "uploading",
            clientId: entry.clientId,
            name: entry.file.name,
            mimeType: entry.file.type || "application/octet-stream",
            previewUrl: entry.previewUrl,
            progress: entry.progress,
          }
        : {
            key: `t:${entry.clientId}`,
            kind: "failed",
            clientId: entry.clientId,
            name: entry.file.name,
            mimeType: entry.file.type || "application/octet-stream",
            previewUrl: entry.previewUrl,
            message: entry.message,
          },
    );

    const stagedRows: ComposerAttachmentTileView[] = visibleStaged.value.map((attachment) => ({
      key: `s:${attachment.id}`,
      kind: "uploaded",
      id: attachment.id,
      name: attachment.originalFilename,
      mimeType: attachment.mimeType,
      url: attachment.url,
      byteSize: attachment.byteSize,
    }));

    return [...transferRows, ...stagedRows];
  });

  const hasBlockingUpload = computed(
    () =>
      pending.value.some((entry) => entry.status === "uploading") ||
      pending.value.some((entry) => entry.status === "failed"),
  );

  const view = computed(
    (): ComposerAttachmentsView => ({
      tiles: tiles.value,
      disabled: disabled.value || !conversationId.value,
      hasBlockingUpload: hasBlockingUpload.value,
    }),
  );

  function resetLocal() {
    revokePreviewUrls(pending.value);
    pending.value = [];
    staged.value = [];
    draftVersion.value = 0;
  }

  async function hydrate() {
    const id = conversationId.value;
    if (!id) {
      resetLocal();
      return;
    }

    try {
      const [{ attachments }, draftResult] = await Promise.all([
        apiClient.listDraftAttachments(id, { threadId: threadId.value ?? null }),
        apiClient.getMessageDraft(id, { threadId: threadId.value ?? null }),
      ]);

      const inline = collectImageAttachmentIdsFromDoc(body.value);
      staged.value = attachments.filter((attachment) => !inline.includes(attachment.id));
      draftVersion.value = draftResult.draft?.version ?? 0;
    } catch {
      staged.value = [];
      draftVersion.value = 0;
    }
  }

  watch(
    [conversationId, threadId],
    () => {
      resetLocal();
      void hydrate();
    },
    { immediate: true },
  );

  function removePending(clientId: string) {
    const entry = pending.value.find((row) => row.clientId === clientId);
    if (!entry) return;
    if (entry.status === "uploading") {
      entry.abort();
    }
    URL.revokeObjectURL(entry.previewUrl);
    pending.value = pending.value.filter((row) => row.clientId !== clientId);
  }

  async function syncDraftAttachmentIds(attachmentIds: AttachmentId[]) {
    const id = conversationId.value;
    if (!id) return;

    try {
      const result = await apiClient.upsertMessageDraft(id, {
        conversationId: id,
        threadId: threadId.value ?? null,
        body: body.value,
        attachmentIds,
        version: draftVersion.value,
      });
      draftVersion.value = result.draft.version;
      staged.value = result.draft.attachments.filter(
        (attachment) => !inlineAttachmentIds.value.includes(attachment.id),
      );
    } catch (error) {
      if (error instanceof ApiMessageDraftConflictError) {
        draftVersion.value = error.draft?.version ?? draftVersion.value;
        if (error.draft) {
          staged.value = error.draft.attachments.filter(
            (attachment) => !inlineAttachmentIds.value.includes(attachment.id),
          );
        } else {
          await hydrate();
        }
        return;
      }
      throw error;
    }
  }

  async function uploadOne(file: File, onProgress?: (percent: number) => void) {
    const id = conversationId.value;
    if (!id) throw new Error("no conversation");

    return uploadConversationFile(apiClient, id, file, {
      threadId: threadId.value ?? null,
      onProgress: (progress) => onProgress?.(progress.percent),
    });
  }

  async function uploadInlineImage(file: File): Promise<{ src: string; attachmentId: AttachmentId }> {
    const attachment = await uploadOne(file);
    staged.value = [...staged.value, attachment];
    return { src: attachment.url, attachmentId: attachment.id };
  }

  async function stageFiles(files: readonly File[]) {
    const id = conversationId.value;
    if (!id || !files.length) return;

    const additions: PendingTransfer[] = files.map((file) => {
      const clientId = crypto.randomUUID();
      return {
        clientId,
        status: "uploading" as const,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        abort: () => undefined,
      };
    });

    pending.value = [...additions, ...pending.value];

    await Promise.all(
      additions.map(async (entry) => {
        const controller = new AbortController();
        pending.value = pending.value.map((row) =>
          row.clientId === entry.clientId && row.status === "uploading"
            ? { ...row, abort: () => controller.abort() }
            : row,
        );

        try {
          const attachment = await uploadConversationFile(apiClient, id, entry.file, {
            threadId: threadId.value ?? null,
            signal: controller.signal,
            onProgress: (progress) => {
              pending.value = pending.value.map((row) =>
                row.clientId === entry.clientId && row.status === "uploading"
                  ? { ...row, progress: progress.percent }
                  : row,
              );
            },
          });

          staged.value = [...staged.value, attachment];
          removePending(entry.clientId);
        } catch (error) {
          if (error instanceof ConversationUploadAbortError) {
            removePending(entry.clientId);
            return;
          }
          const message = error instanceof Error ? error.message : "Upload failed";
          pending.value = pending.value.map((row) =>
            row.clientId === entry.clientId && row.status === "uploading"
              ? {
                  clientId: row.clientId,
                  status: "failed" as const,
                  file: row.file,
                  previewUrl: row.previewUrl,
                  message,
                }
              : row,
          );
        }
      }),
    );
  }

  function stageDroppedOrPastedFiles(files: readonly File[]) {
    const images = files.filter(isImageFile);
    const others = files.filter((file) => !isImageFile(file));
    if (others.length) {
      void stageFiles(others);
    }
    return images;
  }

  async function removeTile(attachmentId: AttachmentId) {
    staged.value = staged.value.filter((attachment) => attachment.id !== attachmentId);
    const remaining = [
      ...staged.value.map((attachment) => attachment.id),
      ...inlineAttachmentIds.value,
    ];
    await syncDraftAttachmentIds([...new Set(remaining)]);
  }

  async function retryUpload(clientId: string) {
    const entry = pending.value.find((row) => row.clientId === clientId);
    if (!entry || entry.status !== "failed") return;
    const { file } = entry;
    removePending(clientId);
    await stageFiles([file]);
  }

  function dismissFailed(clientId: string) {
    removePending(clientId);
  }

  function cancelUpload(clientId: string) {
    removePending(clientId);
  }

  function collectAttachmentIds(doc: JSONContent): AttachmentId[] {
    const tileIds = visibleStaged.value.map((attachment) => attachment.id);
    const inlineIds = collectImageAttachmentIdsFromDoc(doc);
    return [...new Set([...tileIds, ...inlineIds])];
  }

  function collectAttachmentDtos(doc: JSONContent): AttachmentDto[] {
    const ids = new Set(collectAttachmentIds(doc));
    return staged.value.filter((attachment) => ids.has(attachment.id));
  }

  function clearAfterSend() {
    revokePreviewUrls(pending.value);
    pending.value = [];
    staged.value = [];
  }

  function hasSendableContent(doc: JSONContent): boolean {
    const text = JSON.stringify(doc);
    const hasBody = text.length > JSON.stringify(emptyDoc()).length;
    return hasBody || visibleStaged.value.length > 0 || docContainsImageNodes(doc);
  }

  return {
    view,
    stageFiles,
    stageDroppedOrPastedFiles,
    uploadInlineImage,
    removeTile,
    retryUpload,
    dismissFailed,
    cancelUpload,
    collectAttachmentIds,
    collectAttachmentDtos,
    clearAfterSend,
    hasSendableContent,
    hasBlockingUpload,
  };
}
