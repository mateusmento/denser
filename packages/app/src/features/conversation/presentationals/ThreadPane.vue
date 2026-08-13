<script setup lang="ts">
import { Button } from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import type {
  ComposerActionId,
  ConversationThreadView,
  MessageComposerView,
  ScheduleCommitPayload,
} from "../types";
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
  action: [id: ComposerActionId];
  mentionSearch: [query: string];
  react: [messageId: string, emoji: string];
  edit: [messageId: string];
  delete: [messageId: string];
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
      <ConversationMessageItem
        :message="thread.parent"
        :thread-actions="false"
        @react="emit('react', thread.parent.id, $event)"
        @edit="emit('edit', thread.parent.id)"
        @delete="emit('delete', thread.parent.id)"
      />
    </div>

    <div class="min-h-0 flex-1">
      <ConversationMessageList
        :messages="thread.messages"
        :thread-actions="false"
        day-class="bg-card/90"
        @react="(messageId, emoji) => emit('react', messageId, emoji)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
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
        @action="emit('action', $event)"
      />
    </div>
  </div>
</template>
