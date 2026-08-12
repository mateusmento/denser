<script setup lang="ts">
import { Button } from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import type { ConversationThreadView, MessageComposerView, ScheduleCommitPayload } from "../types";
import ConversationMessageItem from "./ConversationMessageItem.vue";
import ConversationMessageList from "./ConversationMessageList.vue";
import MessageComposer from "./MessageComposer.vue";

const draft = defineModel<JSONContent>({ required: true });

defineProps<{
  thread: ConversationThreadView;
  composer: MessageComposerView;
  mentionItems?: readonly MentionCandidate[];
  uploadImage?: (file: File) => Promise<string>;
}>();

const emit = defineEmits<{
  close: [];
  send: [];
  retry: [];
  schedule: [payload: ScheduleCommitPayload];
  mentionSearch: [query: string];
}>();
</script>

<template>
  <div class="flex h-full min-h-0 flex-col" data-slot="thread-pane">
    <header class="flex h-surface-header shrink-0 items-center gap-2 px-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">Thread</p>
        <p class="truncate text-xs text-muted-foreground">
          {{ thread.parent.author.name }}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Close thread" @click="emit('close')">
        <XIcon class="size-4" />
      </Button>
    </header>

    <div class="shrink-0 border-b border-border px-1 py-2">
      <ConversationMessageItem :message="thread.parent" />
    </div>

    <div class="min-h-0 flex-1">
      <ConversationMessageList :messages="thread.messages" />
    </div>

    <div class="box-border flex h-surface-footer shrink-0 flex-col px-2 py-3">
      <MessageComposer
        v-model="draft"
        :view="composer"
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @mention-search="emit('mentionSearch', $event)"
        @send="emit('send')"
        @retry="emit('retry')"
        @schedule="emit('schedule', $event)"
      />
    </div>
  </div>
</template>
