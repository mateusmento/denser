<script setup lang="ts">
import { RichTextPreview } from "@/modules/rich-text";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  Button,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader
} from "@denser/design-system";
import type { ConversationMessageView } from "../types";
import ConversationMessageItemHoverMenu from "./ConversationMessageItemHoverMenu.vue";

withDefaults(
  defineProps<{
    message: ConversationMessageView;
    /** Channel stream: reply count + open-thread actions. Off inside an open thread. */
    threadActions?: boolean;
    messageScrollerViewport?: (HTMLElement | null)[] | HTMLElement | null;
  }>(),
  { threadActions: true, messageScrollerViewport: undefined },
);

const emit = defineEmits<{
  react: [emoji: string];
  thread: [];
  edit: [];
  delete: [];
}>();
</script>

<template>
  <Message
    class="group/item px-2"
    :class="{ 'pt-1.5': !message.grouped }"
    data-slot="conversation-message-item"
    :data-grouped="message.grouped ? '' : undefined"
  >
    <MessageAvatar>
      <Avatar v-if="!message.grouped" size="sm">
        <AvatarImage
          v-if="message.author.avatarUrl"
          :src="message.author.avatarUrl"
          :alt="message.author.name"
        />
        <AvatarFallback>{{ message.author.initials }}</AvatarFallback>
      </Avatar>
    </MessageAvatar>

    <MessageContent class="gap-1.5">
      <MessageHeader v-if="!message.grouped" class="gap-2">
        <span class="text-foreground">{{ message.author.name }}</span>
        <time class="text-muted-foreground">{{ message.createdAtLabel }}</time>
      </MessageHeader>

      <Bubble variant="ghost">
        <ConversationMessageItemHoverMenu
          :message="message"
          :thread-actions="threadActions"
          :collision-boundary="messageScrollerViewport"
          @react="emit('react', $event)"
          @thread="emit('thread')"
          @edit="emit('edit')"
          @delete="emit('delete')"
        >
          <BubbleContent>
            <RichTextPreview :doc="message.body" class="w-fit" />
          </BubbleContent>
        </ConversationMessageItemHoverMenu>
      </Bubble>

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
    </MessageContent>
  </Message>
</template>
