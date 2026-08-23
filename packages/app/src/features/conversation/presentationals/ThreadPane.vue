<script setup lang="ts">
import { Button, MessageScrollerItem } from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import type {
  ComposerActionId,
  ConversationThreadView,
  MessageComposerView,
  ScheduleCommitPayload,
} from "../types";
import ConversationMessage from "./ConversationMessage.vue";
import ConversationMessageGroup from "./ConversationMessageGroup.vue";
import ConversationTimeline from "./ConversationTimeline.vue";
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
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Close thread" @click="emit('close')">
        <XIcon class="size-4" />
      </Button>
    </header>

    <div class="min-h-0 flex-1">
      <ConversationTimeline
        :messages="thread.messages"
        :thread-actions="false"
        day-class="bg-card/90"
        @react="(messageId, emoji) => emit('react', messageId, emoji)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      >
        <template #intro="introSlot">
          <MessageScrollerItem :message-id="thread.parent.id" class="px-0">
            <ConversationMessageGroup
              class="pb-2 pt-4"
              :author="thread.parent.author"
              :created-at-label="thread.parent.createdAtLabel"
            >
              <ConversationMessage
                :message="thread.parent"
                :thread-actions="false"
                :collision-boundary="introSlot.collisionBoundary"
                @react="emit('react', thread.parent.id, $event)"
                @edit="emit('edit', thread.parent.id)"
                @delete="emit('delete', thread.parent.id)"
              />
            </ConversationMessageGroup>
          </MessageScrollerItem>
        </template>
      </ConversationTimeline>
    </div>

    <div class="box-border flex basis-surface-footer shrink-0 flex-col p-2">
      <MessageComposer
        v-model="draft"
        :view="composer"
        class="rounded-xl"
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
