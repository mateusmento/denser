<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessageItem from "../presentationals/ConversationMessageItem.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessageItem",
  component: ConversationMessageItem,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Lead">
    <div class="w-[32rem]">
      <ConversationMessageItem :message="channelMessages[0]!" />
    </div>
  </Story>
  <Story as-child name="WithThread">
    <div class="w-[32rem]">
      <ConversationMessageItem :message="channelMessages[1]!" />
    </div>
  </Story>
</template>
