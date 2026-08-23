<script setup lang="ts">
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  StickyMarker,
} from "@denser/design-system";
import { computed, shallowRef, useTemplateRef, watch } from "vue";
import { conversationDayGroups } from "../messageGrouping";
import type { ConversationIntroView, ConversationMessageView } from "../types";
import ConversationIntro from "./ConversationIntro.vue";
import ConversationMessage from "./ConversationMessage.vue";
import ConversationMessageGroup from "./ConversationMessageGroup.vue";

const props = withDefaults(
  defineProps<{
    messages: readonly ConversationMessageView[];
    /** Start-of-history intro; omit in threads. */
    intro?: ConversationIntroView;
    emptyLabel?: string;
    /** Forwarded to each message; off inside an open thread (no nested threads). */
    threadActions?: boolean;
    /** Sticky day chip fill — match the surrounding surface (channel vs card). */
    dayClass?: string;
  }>(),
  {
    threadActions: true,
    dayClass: "bg-background",
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

const viewport = useTemplateRef<{ viewportElement?: HTMLElement | null }>("viewport");
/** Resolved scroll node for HoverCard collision (tracks MessageScrollerViewport’s exposed ref). */
const collisionBoundary = shallowRef<HTMLElement | null>(null);

watch(
  () => {
    const exposed = viewport.value?.viewportElement;
    return exposed instanceof HTMLElement ? exposed : null;
  },
  (el) => {
    collisionBoundary.value = el;
  },
  { immediate: true, flush: "post" },
);
</script>

<template>
  <MessageScrollerProvider default-scroll-position="end">
    <MessageScroller data-slot="conversation-timeline">
      <MessageScrollerViewport ref="viewport">
        <MessageScrollerContent v-if="hasContent" class="gap-1 pt-0 pb-12">
          <ConversationIntro
            v-if="intro"
            :intro="intro"
            class="pt-14"
            @edit-description="emit('editDescription')"
            @add-people="emit('addPeople')"
          />
          <StickyMarker
            v-for="day in dayGroups"
            :key="day.id"
            :class="dayClass"
          >
            <template #label>
              {{ day.label }}
            </template>
            <ConversationMessageGroup
              v-for="group in day.messageGroups"
              :key="group.id"
              :author="group.author"
              :created-at-label="group.createdAtLabel"
            >
              <MessageScrollerItem
                v-for="message in group.messages"
                :key="message.id"
                :message-id="message.id"
                class="px-0"
              >
                <ConversationMessage
                  :message="message"
                  :thread-actions="threadActions"
                  :collision-boundary="collisionBoundary"
                  @react="emit('react', message.id, $event)"
                  @thread="emit('thread', message.id)"
                  @edit="emit('edit', message.id)"
                  @delete="emit('delete', message.id)"
                />
              </MessageScrollerItem>
            </ConversationMessageGroup>
          </StickyMarker>
        </MessageScrollerContent>
        <p v-else class="px-3 py-8 text-center text-sm text-muted-foreground">
          {{ emptyLabel ?? "No messages yet. Say hello." }}
        </p>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
</template>
