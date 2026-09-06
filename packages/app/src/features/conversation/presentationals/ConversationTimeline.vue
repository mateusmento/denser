<script setup lang="ts">
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  StickyMarker,
} from "@denser/design-system";
import {
  emptyNextPageState,
  emptyPreviousPageState,
  type NextPageState,
  type PreviousPageState,
} from "@/lib/async";
import { computed, shallowRef, useSlots, useTemplateRef, watch } from "vue";
import { conversationDayGroups } from "../messageGrouping";
import type { ConversationIntroView, ConversationMessageView } from "../types";
import ConversationIntro from "./ConversationIntro.vue";
import ConversationMessage from "./ConversationMessage.vue";
import ConversationMessageGroup from "./ConversationMessageGroup.vue";
import ConversationTimelineEdges from "./ConversationTimelineEdges.vue";
import ConversationTimelineScrollerBridge from "./ConversationTimelineScrollerBridge.vue";
import ConversationUnreadDivider from "./ConversationUnreadDivider.vue";

const props = withDefaults(
  defineProps<{
    messages: readonly ConversationMessageView[];
    /** Start-of-history intro; omit in threads (prefer `#intro` slot for custom chrome). */
    intro?: ConversationIntroView;
    emptyLabel?: string;
    /** Forwarded to each message; off inside an open thread (no nested threads). */
    threadActions?: boolean;
    /** Sticky day chip fill — match the surrounding surface (channel vs card). */
    dayClass?: string;
    /** Toward earlier messages in date order. */
    previousPage?: PreviousPageState;
    /** Toward later messages in date order (live edge). */
    nextPage?: NextPageState;
    /** Force jump-to-latest pill visibility (e.g. around-focus / off live edge). */
    showJumpToLatest?: boolean;
    /** Bust timeline edge arm state when the message window recenters. */
    edgeResetKey?: unknown;
    unreadDividerBeforeMessageId?: string | null;
  }>(),
  {
    threadActions: true,
    dayClass: "bg-background",
    previousPage: () => emptyPreviousPageState(),
    nextPage: () => emptyNextPageState(),
    showJumpToLatest: false,
  },
);

const emit = defineEmits<{
  react: [messageId: string, emoji: string];
  thread: [messageId: string];
  copyLink: [messageId: string];
  bookmark: [messageId: string];
  forward: [messageId: string];
  quote: [messageId: string];
  jumpQuote: [messageId: string];
  edit: [messageId: string];
  delete: [messageId: string];
  vote: [messageId: string, optionId: string];
  editDescription: [];
  addPeople: [];
  loadPrevious: [];
  loadNext: [];
  jumpToLatest: [];
}>();

defineSlots<{
  /** Rendered at the top of the scroll content (channel intro or thread parent). */
  intro: (props: { collisionBoundary: HTMLElement | null }) => unknown;
}>();

const slots = useSlots();
const dayGroups = computed(() => conversationDayGroups(props.messages));
const hasContent = computed(
  () => dayGroups.value.length > 0 || Boolean(props.intro) || Boolean(slots.intro),
);

const viewport = useTemplateRef<{ viewportElement?: unknown }>("viewport");
const scrollerBridge = useTemplateRef("scrollerBridge");
/** Resolved scroll node for HoverCard collision (tracks MessageScrollerViewport’s exposed ref). */
const collisionBoundary = shallowRef<HTMLElement | null>(null);

function unwrapViewportElement(exposed: unknown): HTMLElement | null {
  if (exposed instanceof HTMLElement) return exposed;
  if (exposed && typeof exposed === "object" && "value" in exposed) {
    const value = (exposed as { value: unknown }).value;
    if (value instanceof HTMLElement) return value;
  }
  return null;
}

watch(
  () => unwrapViewportElement(viewport.value?.viewportElement),
  (el) => {
    collisionBoundary.value = el;
  },
  { immediate: true, flush: "post" },
);

defineExpose({
  scrollToMessage: (
    messageId: string,
    options?: Parameters<
      NonNullable<typeof scrollerBridge.value>["scrollToMessage"]
    >[1],
  ) => scrollerBridge.value?.scrollToMessage(messageId, options) ?? false,
});
</script>

<template>
  <MessageScrollerProvider default-scroll-position="end">
    <MessageScroller data-slot="conversation-timeline">
      <MessageScrollerViewport ref="viewport">
        <MessageScrollerContent v-if="hasContent" class="gap-1 pt-0 pb-12">
          <slot name="intro" :collision-boundary="collisionBoundary">
            <ConversationIntro
              v-if="intro"
              :intro="intro"
              class="pt-14"
              @edit-description="emit('editDescription')"
              @add-people="emit('addPeople')"
            />
          </slot>
          <StickyMarker v-for="day in dayGroups" :key="day.id" :class="dayClass">
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
                <ConversationUnreadDivider
                  v-if="unreadDividerBeforeMessageId === message.id"
                />
                <ConversationMessage
                  :message="message"
                  :thread-actions="threadActions"
                  :collision-boundary="collisionBoundary"
                  @react="emit('react', message.id, $event)"
                  @thread="emit('thread', message.id)"
                  @copy-link="emit('copyLink', message.id)"
                  @bookmark="emit('bookmark', message.id)"
                  @forward="emit('forward', message.id)"
                  @quote="emit('quote', message.id)"
                  @jump-quote="emit('jumpQuote', $event)"
                  @edit="emit('edit', message.id)"
                  @delete="emit('delete', message.id)"
                  @vote="emit('vote', message.id, $event)"
                />
              </MessageScrollerItem>
            </ConversationMessageGroup>
          </StickyMarker>
        </MessageScrollerContent>
        <p v-else class="px-3 py-8 text-center text-sm text-muted-foreground">
          {{ emptyLabel ?? "No messages yet. Say hello." }}
        </p>
      </MessageScrollerViewport>
      <ConversationTimelineEdges
        :previous-page="previousPage"
        :next-page="nextPage"
        :show-jump-to-latest="showJumpToLatest"
        :edge-reset-key="edgeResetKey"
        @load-previous="emit('loadPrevious')"
        @load-next="emit('loadNext')"
        @jump-to-latest="emit('jumpToLatest')"
      />
      <ConversationTimelineScrollerBridge ref="scrollerBridge" />
    </MessageScroller>
  </MessageScrollerProvider>
</template>
