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
  Button,
  Progress,
  Spinner,
} from "@denser/design-system";
import { FileIcon, ImageIcon, RotateCcwIcon, XIcon } from "@lucide/vue";
import type { ComposerAttachmentTileView } from "../types";
import { formatByteSize } from "../lib/format-byte-size";
import { isAudioMime } from "../lib/is-media-mime";
import AudioAttachmentPlayer from "./AudioAttachmentPlayer.vue";

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

function audioSource(tile: ComposerAttachmentTileView): string {
  return tile.kind === "uploaded" ? tile.url : tile.previewUrl;
}
</script>

<template>
  <AttachmentGroup v-if="tiles.length" class="px-3 pt-2" aria-label="Attachments">
    <template v-for="tile in tiles" :key="tile.key">
      <div
        v-if="isAudioMime(tile.mimeType)"
        class="flex w-full max-w-md items-center gap-2"
        :data-state="tile.kind === 'uploading' ? 'uploading' : tile.kind === 'failed' ? 'error' : 'done'"
      >
        <div class="relative min-w-0 flex-1">
          <AudioAttachmentPlayer
            :url="audioSource(tile)"
            :name="tile.name"
            :class="tile.kind === 'uploading' ? 'pointer-events-none opacity-70' : ''"
          />
          <Spinner
            v-if="tile.kind === 'uploading'"
            class="pointer-events-none absolute inset-0 m-auto size-5 text-foreground"
          />
        </div>

        <div v-if="tile.kind === 'uploading'" class="flex w-24 shrink-0 flex-col gap-1">
          <span class="text-xs text-muted-foreground">{{ tile.progress }}%</span>
          <Progress :model-value="tile.progress" class="h-1" />
        </div>

        <p v-else-if="tile.kind === 'failed'" class="max-w-28 truncate text-xs text-destructive">
          {{ tile.message ?? "Upload failed" }}
        </p>

        <div class="flex shrink-0 items-center gap-0.5">
          <Button
            v-if="tile.kind === 'uploaded'"
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Remove attachment"
            :disabled="disabled"
            @click="emit('remove', tile.id)"
          >
            <XIcon class="size-3.5" />
          </Button>
          <Button
            v-else-if="tile.kind === 'uploading'"
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel upload"
            :disabled="disabled"
            @click="emit('cancel', tile.clientId)"
          >
            <XIcon class="size-3.5" />
          </Button>
          <template v-else>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Retry upload"
              :disabled="disabled"
              @click="emit('retry', tile.clientId)"
            >
              <RotateCcwIcon class="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Dismiss failed upload"
              :disabled="disabled"
              @click="emit('dismiss', tile.clientId)"
            >
              <XIcon class="size-3.5" />
            </Button>
          </template>
        </div>
      </div>

      <Attachment
        v-else
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
    </template>
  </AttachmentGroup>
</template>
