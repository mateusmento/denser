<script setup lang="ts">
import { Button, MessageScrollerItem } from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { JSONContent, MentionCandidate } from "@/modules/rich-text";
import type { RichTextUploadResult } from "@/modules/rich-text/lib/extensions";
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
    uploadImage?: (file: File) => Promise<RichTextUploadResult>;
    onStageFiles?: (files: File[]) => void;
    canSend?: boolean;
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
  cancelEdit: [];
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
  vote: [messageId: string, optionId: string];
  loadPrevious: [];
  jumpToLatest: [];
  removeAttachment: [attachmentId: string];
  cancelUpload: [clientId: string];
  retryUpload: [clientId: string];
  dismissUpload: [clientId: string];
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
        @vote="(messageId, optionId) => emit('vote', messageId, optionId)"
        @load-previous="emit('loadPrevious')"
        @jump-to-latest="emit('jumpToLatest')"
      >
        <template #intro="introSlot">
          <MessageScrollerItem :message-id="props.thread.parent.id" class="px-0">
            <ConversationMessageGroup
              class="pt-4 pb-2"
              :author="props.thread.parent.author"
              :created-at-label="props.thread.parent.createdAtLabel"
            >
              <ConversationMessage
                :message="props.thread.parent"
                :thread-actions="false"
                :collision-boundary="introSlot.collisionBoundary"
                @react="emit('react', props.thread.parent.id, $event)"
                @copy-link="emit('copyLink', props.thread.parent.id)"
                @bookmark="emit('bookmark', props.thread.parent.id)"
                @forward="emit('forward', props.thread.parent.id)"
                @quote="emit('quote', props.thread.parent.id)"
                @jump-quote="emit('jumpQuote', $event)"
                @edit="emit('edit', props.thread.parent.id)"
                @delete="emit('delete', props.thread.parent.id)"
                @vote="(optionId) => emit('vote', props.thread.parent.id, optionId)"
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
        :on-stage-files="onStageFiles"
        :can-send="canSend"
        @mention-search="emit('mentionSearch', $event)"
        @send="emit('send')"
        @cancel-edit="emit('cancelEdit')"
        @retry="emit('retry')"
        @schedule="emit('schedule', $event)"
        @action="emit('action', $event)"
        @remove-attachment="emit('removeAttachment', $event)"
        @cancel-upload="emit('cancelUpload', $event)"
        @retry-upload="emit('retryUpload', $event)"
        @dismiss-upload="emit('dismissUpload', $event)"
      />
    </div>
  </div>
</template>
