<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessageItem from "../presentationals/ConversationMessageItem.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessageItem",
  component: ConversationMessageItem,
  tags: ["autodocs"],
});

function onReact(emoji: string) {
  toast(emoji);
}

function onThread() {
  toast("Open thread");
}

function onEdit() {
  toast("Edit");
}

function onDelete() {
  toast("Delete");
}
</script>

<template>
  <Story as-child name="Lead">
    <div class="w-lg">
      <ConversationMessageItem
        :message="channelMessages[0]!"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
  <Story as-child name="WithThread">
    <div class="w-lg">
      <ConversationMessageItem
        :message="channelMessages[1]!"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
  <Story as-child name="InThreadPane">
    <div class="w-lg">
      <ConversationMessageItem
        :message="channelMessages[1]!"
        :thread-actions="false"
        @react="onReact"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
</template>
