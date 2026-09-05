<script setup lang="ts">
import { RichTextPreview } from "@/modules/rich-text";
import { cn } from "@denser/design-system";
import { QuoteIcon } from "@lucide/vue";
import { useResizeObserver } from "@vueuse/core";
import { computed, ref, shallowRef } from "vue";
import type { ConversationQuotedPreviewView } from "../types";

const props = defineProps<{
  quoted: ConversationQuotedPreviewView;
}>();

const emit = defineEmits<{
  activate: [];
}>();

const clipRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const overflows = shallowRef(false);

const hasBody = computed(() => props.quoted.displayContent.trim().length > 0);

function syncOverflow() {
  const clip = clipRef.value;
  const content = contentRef.value;
  if (!clip || !content) {
    overflows.value = false;
    return;
  }
  overflows.value = content.scrollHeight > clip.clientHeight + 1;
}

useResizeObserver(clipRef, syncOverflow);
useResizeObserver(contentRef, syncOverflow);
</script>

<template>
  <button
    type="button"
    data-slot="conversation-quote-preview"
    :class="
      cn(
        'mb-1 flex w-full min-w-0 cursor-pointer items-stretch gap-2 rounded-md border-0 p-0 text-left',
        'text-muted-foreground transition-colors hover:bg-muted/40',
      )
    "
    @click="emit('activate')"
  >
    <QuoteIcon class="mt-0.5 size-4 shrink-0 self-start opacity-70" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <span class="text-xs font-medium text-foreground/80">{{ quoted.author.name }}</span>
      <div ref="clipRef" class="relative max-h-40 overflow-hidden">
        <div ref="contentRef" class="text-sm">
          <RichTextPreview v-if="hasBody" :doc="quoted.body" class="w-fit" />
          <p v-else-if="quoted.hasAttachment" class="text-sm text-muted-foreground">Attachment</p>
        </div>
        <div
          v-if="overflows"
          class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  </button>
</template>
