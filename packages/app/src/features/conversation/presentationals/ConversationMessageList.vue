<script setup lang="ts">
import {
  cn,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Separator
} from "@denser/design-system";
import { computed, ref } from "vue";
import { conversationDayGroups } from "../messageGrouping";
import type { ConversationIntroView, ConversationMessageView } from "../types";
import ConversationIntro from "./ConversationIntro.vue";
import ConversationMessageItem from "./ConversationMessageItem.vue";
import MessageContextMenu from "./MessageContextMenu.vue";

const props = withDefaults(
  defineProps<{
    messages: readonly ConversationMessageView[];
    /** Start-of-history intro; omit in threads. */
    intro?: ConversationIntroView;
    emptyLabel?: string;
    /** Forwarded to each item; off inside an open thread (no nested threads). */
    threadActions?: boolean;
    /** Sticky day chip fill — match the surrounding surface (channel vs card). */
    dayClass?: string;
  }>(),
  {
    threadActions: true,
    dayClass: "bg-background/90",
  },
);

const emit = defineEmits<{
  react: [messageId: string, emoji: string];
  thread: [messageId: string];
  edit: [messageId: string];
  delete: [messageId: string];
  editDescription: [];
  addPeople: [];
}>();

const dayGroups = computed(() => conversationDayGroups(props.messages));
const hasContent = computed(() => dayGroups.value.length > 0 || Boolean(props.intro));

const messageScrollerViewport = ref<HTMLElement[] | HTMLElement | null>(null);
</script>

<template>
  <MessageScrollerProvider default-scroll-position="end">
    <MessageScroller data-slot="conversation-message-list">
      <MessageScrollerViewport ref="messageScrollerViewport">
        <MessageScrollerContent v-if="hasContent" class="gap-1 pt-0 pb-12">
          <ConversationIntro
            v-if="intro"
            :intro="intro"
            class="pt-14"
            @edit-description="emit('editDescription')"
            @add-people="emit('addPeople')"
          />
          <section
            v-for="group in dayGroups"
            :key="group.id"
            class="relative flex flex-col gap-1.5"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-8 items-center"
              aria-hidden="true"
            >
              <Separator class="w-full" />
            </div>
            <div class="sticky top-0 z-10 flex justify-center py-1">
              <div
                :class="cn(
                  'relative w-fit border border-border rounded-full px-3 py-1 whitespace-nowrap',
                  'hover:bg-muted text-center text-xs text-muted-foreground backdrop-blur-sm cursor-pointer',
                  dayClass,
                )"
              >
                {{ group.label }}
              </div>
            </div>
            <MessageScrollerItem
              v-for="message in group.messages"
              :key="message.id"
              :message-id="message.id"
              class="px-0"
            >
              <MessageContextMenu
                :message="message"
                @edit="emit('edit', message.id)"
                @delete="emit('delete', message.id)"
              >
                <ConversationMessageItem
                  :message="message"
                  :thread-actions="threadActions"
                  @react="emit('react', message.id, $event)"
                  @thread="emit('thread', message.id)"
                  @edit="emit('edit', message.id)"
                  @delete="emit('delete', message.id)"
                />
              </MessageContextMenu>
            </MessageScrollerItem>
          </section>
        </MessageScrollerContent>
        <p v-else class="px-3 py-8 text-center text-sm text-muted-foreground">
          {{ emptyLabel ?? "No messages yet. Say hello." }}
        </p>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
</template>
