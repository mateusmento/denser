<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessageItem from "../presentationals/ConversationMessageItem.vue";
import MessageContextMenu from "../presentationals/MessageContextMenu.vue";

const { Story } = defineMeta({
  title: "features/conversation/MessageContextMenu",
  component: MessageContextMenu,
  tags: ["autodocs"],
});

const message = channelMessages[4] ?? channelMessages[0]!;
</script>

<template>
  <Story as-child name="Default">
    <div class="w-md rounded-lg border p-2">
      <p class="mb-2 text-xs text-muted-foreground">Right-click the message</p>
      <MessageContextMenu
        :message="message"
        @edit="toast(`Edit · ${message.id}`)"
        @delete="toast(`Delete · ${message.id}`)"
      >
        <ConversationMessageItem
          :message="message"
          @edit="toast(`Edit · ${message.id}`)"
          @delete="toast(`Delete · ${message.id}`)"
        />
      </MessageContextMenu>
    </div>
  </Story>
</template>
