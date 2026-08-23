<script setup lang="ts">
import { RichTextPreview } from "@/modules/rich-text";
import {
  Bubble,
  BubbleContent,
  Button,
  MessageFooter,
} from "@denser/design-system";
import type { ConversationMessageView } from "../types";
import MessageContextMenu from "./MessageContextMenu.vue";
import MessageHoverMenu from "./MessageHoverMenu.vue";

withDefaults(
  defineProps<{
    message: ConversationMessageView;
    /** Channel stream: reply count + open-thread actions. Off inside an open thread. */
    threadActions?: boolean;
    /** Hover menu collision boundary (e.g. timeline scroller viewport). */
    collisionBoundary?: HTMLElement | (HTMLElement | null)[] | null;
  }>(),
  { threadActions: true, collisionBoundary: undefined },
);

const emit = defineEmits<{
  react: [emoji: string];
  thread: [];
  edit: [];
  delete: [];
}>();
</script>

<template>
  <div data-slot="conversation-message" class="flex min-w-0 flex-col gap-1.5">
    <MessageContextMenu
      :message="message"
      @edit="emit('edit')"
      @delete="emit('delete')"
    >
      <Bubble variant="ghost">
        <MessageHoverMenu
          :message="message"
          :thread-actions="threadActions"
          :collision-boundary="collisionBoundary"
          @react="emit('react', $event)"
          @thread="emit('thread')"
          @edit="emit('edit')"
          @delete="emit('delete')"
        >
          <template #default="{ highlighted }">
            <BubbleContent :data-highlighted="highlighted ? '' : undefined">
              <RichTextPreview :doc="message.body" class="w-fit" />
            </BubbleContent>
          </template>
        </MessageHoverMenu>
      </Bubble>
    </MessageContextMenu>

    <ul v-if="message.attachments?.length" class="flex flex-wrap gap-1">
      <li
        v-for="attachment in message.attachments"
        :key="attachment.id"
        class="rounded-md bg-muted px-2 py-1 text-xs"
      >
        {{ attachment.name }}
      </li>
    </ul>

    <MessageFooter
      v-if="message.reactions.length || (threadActions && message.replyCount)"
      class="gap-1"
    >
      <Button
        v-for="reaction in message.reactions"
        :key="reaction.emoji"
        size="xs"
        :variant="reaction.mine ? 'secondary' : 'ghost'"
        @click="emit('react', reaction.emoji)"
      >
        {{ reaction.emoji }} {{ reaction.count }}
      </Button>
      <Button
        v-if="threadActions && message.replyCount"
        size="xs"
        variant="ghost"
        @click="emit('thread')"
      >
        {{ message.replyCount }} {{ message.replyCount === 1 ? "reply" : "replies" }}
      </Button>
    </MessageFooter>
  </div>
</template>
