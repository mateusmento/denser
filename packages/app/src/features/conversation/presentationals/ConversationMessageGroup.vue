<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  cn,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@denser/design-system";
import type { ConversationPersonView } from "../types";

const props = withDefaults(
  defineProps<{
    author: ConversationPersonView;
    createdAtLabel: string;
    align?: "start" | "end";
    class?: HTMLAttributes["class"];
  }>(),
  { align: "start" },
);
</script>

<template>
  <Message
    :class="cn('group/item px-3 pt-1.5', props.class)"
    data-slot="conversation-message-group"
    :align="align"
  >
    <MessageAvatar>
      <Avatar size="sm">
        <AvatarImage
          v-if="author.avatarUrl"
          :src="author.avatarUrl"
          :alt="author.name"
        />
        <AvatarFallback>{{ author.initials }}</AvatarFallback>
      </Avatar>
    </MessageAvatar>

    <MessageContent class="gap-1.5">
      <MessageHeader class="gap-2">
        <span class="text-foreground">{{ author.name }}</span>
        <time class="text-muted-foreground">{{ createdAtLabel }}</time>
      </MessageHeader>
      <slot />
    </MessageContent>
  </Message>
</template>
