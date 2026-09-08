import type { ArtifactId, AttachmentDto, AttachmentId, UserId } from "@denser/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toReadonlyRef, type ReadonlyRefOrGetter } from "@/lib/vue";
import { formatByteSize } from "../lib/format-byte-size";
import type { ConversationFileRowView, ConversationFilesPaneView } from "../types";

function toFileRow(
  attachment: AttachmentDto,
  currentUserId: UserId | undefined,
  resolveUploaderName: (userId: UserId) => string,
): ConversationFileRowView {
  const createdAt = new Date(attachment.createdAt);
  return {
    id: attachment.id,
    name: attachment.originalFilename,
    mimeType: attachment.mimeType,
    url: attachment.url,
    byteSize: attachment.byteSize,
    byteSizeLabel: formatByteSize(attachment.byteSize),
    uploaderName: resolveUploaderName(attachment.uploadedBy),
    createdAtLabel: createdAt.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    canDelete: currentUserId != null && attachment.uploadedBy === currentUserId,
  };
}

export function useConversationFilesSync(
  conversationId: ReadonlyRefOrGetter<ArtifactId | undefined>,
  options: {
    currentUserId: ReadonlyRefOrGetter<UserId | undefined>;
    resolveUploaderName: (userId: UserId) => string;
    enabled: ReadonlyRefOrGetter<boolean>;
  },
) {
  const id = toReadonlyRef(conversationId);
  const enabled = toReadonlyRef(options.enabled);
  const currentUserId = toReadonlyRef(options.currentUserId);
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: computed(() => queryKeys.conversationFiles(id.value ?? "")),
    enabled: computed(() => enabled.value && id.value != null),
    queryFn: async () => {
      const { attachments } = await apiClient.listDeliveredAttachments(id.value!);
      return attachments;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: AttachmentId) =>
      apiClient.releaseDeliveredAttachment(id.value!, attachmentId),
    onSuccess: () => {
      if (id.value) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversationFiles(id.value) });
      }
    },
  });

  const view = computed((): ConversationFilesPaneView => {
    if (filesQuery.isLoading.value) return { state: "loading", files: [] };
    if (filesQuery.isError.value) {
      return { state: "error", files: [], errorMessage: "Couldn’t load files." };
    }
    const attachments = filesQuery.data.value ?? [];
    return {
      state: "ready",
      files: attachments.map((attachment) =>
        toFileRow(attachment, currentUserId.value, options.resolveUploaderName),
      ),
    };
  });

  return {
    view,
    reload: () => filesQuery.refetch(),
    deleteFile: (attachmentId: AttachmentId) => deleteMutation.mutateAsync(attachmentId),
    isDeleting: computed(() => deleteMutation.isPending.value),
  };
}
