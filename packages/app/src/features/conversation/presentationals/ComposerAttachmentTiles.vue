<script setup lang="ts">
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Progress,
  Spinner,
} from "@denser/design-system";
import { FileIcon, ImageIcon, RotateCcwIcon, XIcon } from "@lucide/vue";
import type { ComposerAttachmentTileView } from "../types";
import { formatByteSize } from "../lib/format-byte-size";

defineProps<{
  tiles: readonly ComposerAttachmentTileView[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  remove: [attachmentId: string];
  cancel: [clientId: string];
  retry: [clientId: string];
  dismiss: [clientId: string];
}>();

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
</script>

<template>
  <AttachmentGroup v-if="tiles.length" class="px-3 pt-2" aria-label="Attachments">
    <Attachment
      v-for="tile in tiles"
      :key="tile.key"
      size="sm"
      orientation="horizontal"
      :state="
        tile.kind === 'uploading'
          ? 'uploading'
          : tile.kind === 'failed'
            ? 'error'
            : 'done'
      "
      class="max-w-56"
    >
      <AttachmentMedia :variant="isImageMime(tile.mimeType) ? 'image' : 'icon'">
        <template v-if="tile.kind === 'uploaded' && isImageMime(tile.mimeType)">
          <img :src="tile.url" :alt="tile.name" />
        </template>
        <template v-else-if="tile.kind !== 'uploaded' && isImageMime(tile.mimeType)">
          <img :src="tile.previewUrl" :alt="tile.name" class="opacity-70" />
        </template>
        <ImageIcon v-else-if="isImageMime(tile.mimeType)" class="size-4" />
        <FileIcon v-else class="size-4" />
        <Spinner
          v-if="tile.kind === 'uploading'"
          class="absolute inset-0 m-auto size-5 text-foreground"
        />
      </AttachmentMedia>

      <AttachmentContent class="min-w-0">
        <AttachmentTitle class="truncate">{{ tile.name }}</AttachmentTitle>
        <AttachmentDescription v-if="tile.kind === 'uploaded'">
          {{ formatByteSize(tile.byteSize) }}
        </AttachmentDescription>
        <AttachmentDescription v-else-if="tile.kind === 'uploading'">
          Uploading {{ tile.progress }}%
        </AttachmentDescription>
        <AttachmentDescription v-else class="text-destructive">
          {{ tile.message ?? "Upload failed" }}
        </AttachmentDescription>
        <Progress
          v-if="tile.kind === 'uploading'"
          :model-value="tile.progress"
          class="mt-1 h-1"
        />
      </AttachmentContent>

      <AttachmentActions>
        <AttachmentAction
          v-if="tile.kind === 'uploaded'"
          aria-label="Remove attachment"
          :disabled="disabled"
          @click="emit('remove', tile.id)"
        >
          <XIcon class="size-3.5" />
        </AttachmentAction>
        <AttachmentAction
          v-else-if="tile.kind === 'uploading'"
          aria-label="Cancel upload"
          :disabled="disabled"
          @click="emit('cancel', tile.clientId)"
        >
          <XIcon class="size-3.5" />
        </AttachmentAction>
        <template v-else>
          <AttachmentAction
            aria-label="Retry upload"
            :disabled="disabled"
            @click="emit('retry', tile.clientId)"
          >
            <RotateCcwIcon class="size-3.5" />
          </AttachmentAction>
          <AttachmentAction
            aria-label="Dismiss failed upload"
            :disabled="disabled"
            @click="emit('dismiss', tile.clientId)"
          >
            <XIcon class="size-3.5" />
          </AttachmentAction>
        </template>
      </AttachmentActions>
    </Attachment>
  </AttachmentGroup>
</template>
