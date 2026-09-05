<script setup lang="ts">
import { Button, MessageScrollerItem } from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import {
  emptyNextPageState,
  emptyPreviousPageState,
  type NextPageState,
  type PreviousPageState,
} from "@/lib/async";
import ConversationMessage from "./ConversationMessage.vue";
import ConversationMessageGroup from "./ConversationMessageGroup.vue";
import ConversationTimeline from "./ConversationTimeline.vue";
import MessageComposer from "./MessageComposer.vue";

import type {
  ComposerActionId,
  ConversationThreadView,
  MessageComposerView,
  ScheduleCommitPayload,
} from "../types";

const draft = defineModel<JSONContent>({ required: true });

const props = withDefaults(
  defineProps<{
    thread: ConversationThreadView;
    composer: MessageComposerView;
    mentionItems?: readonly MentionCandidate[];
    uploadImage?: (file: File) => Promise<string>;
    previousPage?: PreviousPageState;
    nextPage?: NextPageState;
    showJumpToLatest?: boolean;
  }>(),
  {
    previousPage: () => emptyPreviousPageState(),
    nextPage: () => emptyNextPageState(),
    showJumpToLatest: false,
  },
);

const emit = defineEmits<{
  close: [];
  send: [];
  retry: [];
  schedule: [payload: ScheduleCommitPayload];
  action: [id: ComposerActionId];
  mentionSearch: [query: string];
  react: [messageId: string, emoji: string];
  copyLink: [messageId: string];
  bookmark: [messageId: string];
  forward: [messageId: string];
  quote: [messageId: string];
  jumpQuote: [messageId: string];
  edit: [messageId: string];
  delete: [messageId: string];
  loadPrevious: [];
  jumpToLatest: [];
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
        :messages="props.thread.messages"
        :thread-actions="false"
        :previous-page="props.previousPage"
        :next-page="props.nextPage"
        :show-jump-to-latest="props.showJumpToLatest"
        day-class="bg-muted/90 light:bg-mist-50/90"
        @react="(messageId, emoji) => emit('react', messageId, emoji)"
        @copy-link="emit('copyLink', $event)"
        @bookmark="emit('bookmark', $event)"
        @forward="emit('forward', $event)"
        @quote="emit('quote', $event)"
        @jump-quote="emit('jumpQuote', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @load-previous="emit('loadPrevious')"
        @jump-to-latest="emit('jumpToLatest')"
      >
        <template #intro="introSlot">
          <MessageScrollerItem :message-id="thread.parent.id" class="px-0">
            <ConversationMessageGroup
              class="pt-4 pb-2"
              :author="thread.parent.author"
              :created-at-label="thread.parent.createdAtLabel"
            >
              <ConversationMessage
                :message="thread.parent"
                :thread-actions="false"
                :collision-boundary="introSlot.collisionBoundary"
                @react="emit('react', thread.parent.id, $event)"
                @copy-link="emit('copyLink', thread.parent.id)"
                @bookmark="emit('bookmark', thread.parent.id)"
                @forward="emit('forward', thread.parent.id)"
                @quote="emit('quote', thread.parent.id)"
                @jump-quote="emit('jumpQuote', $event)"
                @edit="emit('edit', thread.parent.id)"
                @delete="emit('delete', thread.parent.id)"
              />
            </ConversationMessageGroup>
          </MessageScrollerItem>
        </template>
      </ConversationTimeline>
    </div>

    <div class="box-border flex shrink-0 basis-surface-footer flex-col p-2 pt-0">
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
