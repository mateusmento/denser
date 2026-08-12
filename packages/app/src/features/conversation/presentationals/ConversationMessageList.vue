<script setup lang="ts">
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@denser/design-system";
import { computed } from "vue";
import { conversationListItems } from "../messageGrouping";
import type { ConversationMessageView } from "../types";
import ConversationMessageItem from "./ConversationMessageItem.vue";

const props = defineProps<{
  messages: readonly ConversationMessageView[];
  emptyLabel?: string;
}>();

const emit = defineEmits<{
  react: [messageId: string, emoji: string];
  thread: [messageId: string];
  edit: [messageId: string];
  delete: [messageId: string];
}>();

const items = computed(() => conversationListItems(props.messages));
</script>

<template>
  <MessageScrollerProvider default-scroll-position="end">
    <MessageScroller data-slot="conversation-message-list">
      <MessageScrollerViewport>
        <MessageScrollerContent v-if="items.length" class="gap-1 py-2">
          <template v-for="item in items" :key="item.kind === 'day' ? item.id : item.message.id">
            <div
              v-if="item.kind === 'day'"
              class="sticky top-0 z-10 bg-background/90 py-1 text-center text-xs text-muted-foreground backdrop-blur-sm"
            >
              {{ item.label }}
            </div>
            <MessageScrollerItem v-else :message-id="item.message.id">
              <ConversationMessageItem
                :message="item.message"
                @react="emit('react', item.message.id, $event)"
                @thread="emit('thread', item.message.id)"
                @edit="emit('edit', item.message.id)"
                @delete="emit('delete', item.message.id)"
              />
            </MessageScrollerItem>
          </template>
        </MessageScrollerContent>
        <p v-else class="px-3 py-8 text-center text-sm text-muted-foreground">
          {{ emptyLabel ?? "No messages yet. Say hello." }}
        </p>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
</template>
