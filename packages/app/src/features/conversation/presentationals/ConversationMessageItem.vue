<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@denser/design-system";
import { MessageSquareIcon, PencilIcon, SmileIcon, TrashIcon } from "@lucide/vue";
import { RichTextPreview } from "@/modules/rich-text";
import type { ConversationMessageView } from "../types";

defineProps<{
  message: ConversationMessageView;
}>();

const emit = defineEmits<{
  react: [emoji: string];
  thread: [];
  edit: [];
  delete: [];
}>();
</script>

<template>
  <Message
    class="group/item px-1 py-0.5 sm:px-2"
    data-slot="conversation-message-item"
    :data-grouped="message.grouped ? '' : undefined"
  >
    <MessageAvatar v-if="!message.grouped">
      <Avatar size="sm">
        <AvatarImage
          v-if="message.author.avatarUrl"
          :src="message.author.avatarUrl"
          :alt="message.author.name"
        />
        <AvatarFallback>{{ message.author.initials }}</AvatarFallback>
      </Avatar>
    </MessageAvatar>
    <div v-else class="w-8 shrink-0" aria-hidden="true" />

    <MessageContent>
      <MessageHeader v-if="!message.grouped" class="gap-2">
        <span class="text-foreground">{{ message.author.name }}</span>
        <time class="text-muted-foreground">{{ message.createdAtLabel }}</time>
      </MessageHeader>

      <RichTextPreview :doc="message.body" />

      <ul v-if="message.attachments?.length" class="flex flex-wrap gap-1">
        <li
          v-for="attachment in message.attachments"
          :key="attachment.id"
          class="rounded-md bg-muted px-2 py-1 text-xs"
        >
          {{ attachment.name }}
        </li>
      </ul>

      <MessageFooter v-if="message.reactions.length || message.replyCount" class="gap-1">
        <Button
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          size="xs"
          :variant="reaction.mine ? 'secondary' : 'ghost'"
          @click="emit('react', reaction.emoji)"
        >
          {{ reaction.emoji }} {{ reaction.count }}
        </Button>
        <Button v-if="message.replyCount" size="xs" variant="ghost" @click="emit('thread')">
          {{ message.replyCount }} {{ message.replyCount === 1 ? "reply" : "replies" }}
        </Button>
      </MessageFooter>
    </MessageContent>

    <div
      class="absolute end-2 top-1 hidden gap-0.5 group-focus-within/item:flex group-hover/item:flex"
    >
      <Button size="icon-xs" variant="ghost" aria-label="Add reaction" @click="emit('react', '👍')">
        <SmileIcon class="size-3.5" />
      </Button>
      <Button size="icon-xs" variant="ghost" aria-label="Reply in thread" @click="emit('thread')">
        <MessageSquareIcon class="size-3.5" />
      </Button>
      <Button
        v-if="message.canEdit"
        size="icon-xs"
        variant="ghost"
        aria-label="Edit"
        @click="emit('edit')"
      >
        <PencilIcon class="size-3.5" />
      </Button>
      <Button
        v-if="message.canDelete"
        size="icon-xs"
        variant="ghost"
        aria-label="Delete"
        @click="emit('delete')"
      >
        <TrashIcon class="size-3.5" />
      </Button>
    </div>
  </Message>
</template>
