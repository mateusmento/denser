<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessageList from "../presentationals/ConversationMessageList.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessageList",
  component: ConversationMessageList,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});
</script>

<template>
  <Story as-child name="History">
    <div class="h-[28rem] w-[36rem]">
      <ConversationMessageList :messages="channelMessages" />
    </div>
  </Story>
  <Story as-child name="Empty">
    <div class="h-[28rem] w-[36rem]">
      <ConversationMessageList :messages="[]" />
    </div>
  </Story>
</template>
