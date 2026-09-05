<script setup lang="ts">
import { computed } from "vue";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@denser/design-system";
import { FileIcon, VideoIcon } from "@lucide/vue";
import { formatByteSize } from "../lib/format-byte-size";
import { isMediaMime } from "../lib/is-media-mime";
import type { ConversationAttachmentView } from "../types";

const props = defineProps<{
  attachments: readonly ConversationAttachmentView[];
}>();

const media = computed(() => props.attachments.filter((attachment) => attachment.kind === "media"));
const files = computed(() => props.attachments.filter((attachment) => attachment.kind === "file"));
</script>

<template>
  <div
    v-if="attachments.length"
    data-slot="message-attachments"
    class="flex w-full min-w-0 flex-col gap-2"
  >
    <div v-if="media.length" class="flex flex-wrap gap-2">
      <a
        v-for="attachment in media"
        :key="attachment.id"
        :href="attachment.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative block size-36 shrink-0 overflow-hidden rounded-lg border bg-muted no-underline transition-colors hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        :aria-label="`Open ${attachment.name}`"
      >
        <img
          v-if="isMediaMime(attachment.mimeType) && attachment.mimeType.startsWith('image/')"
          :src="attachment.url"
          :alt="attachment.name"
          class="size-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="flex size-full items-center justify-center bg-muted text-muted-foreground"
        >
          <VideoIcon class="size-8" />
        </div>
        <span
          class="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {{ attachment.name }}
        </span>
      </a>
    </div>

    <div v-if="files.length" class="flex w-full max-w-md flex-col gap-1.5">
      <a
        v-for="attachment in files"
        :key="attachment.id"
        :href="attachment.url"
        target="_blank"
        rel="noopener noreferrer"
        class="block w-full max-w-md no-underline"
      >
        <Attachment size="sm" orientation="horizontal" class="w-full max-w-md hover:bg-muted/50">
          <AttachmentMedia variant="icon">
            <FileIcon class="size-4" />
          </AttachmentMedia>
          <AttachmentContent class="min-w-0">
            <AttachmentTitle class="truncate">{{ attachment.name }}</AttachmentTitle>
            <AttachmentDescription>{{ formatByteSize(attachment.byteSize) }}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </a>
    </div>
  </div>
</template>
