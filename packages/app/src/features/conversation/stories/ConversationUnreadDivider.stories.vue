<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import ConversationUnreadDivider from "../presentationals/ConversationUnreadDivider.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationUnreadDivider",
  component: ConversationUnreadDivider,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Default">
    <div class="w-[28rem] bg-background py-4">
      <ConversationUnreadDivider />
    </div>
  </Story>
</template>
