<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelIntro, channelMessages } from "../fixtures";
import ConversationMessageList from "../presentationals/ConversationMessageList.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessageList",
  component: ConversationMessageList,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

function onReact(messageId: string, emoji: string) {
  toast(`${emoji} on ${messageId}`);
}

function onThread(messageId: string) {
  toast(`Thread · ${messageId}`);
}

function onEdit(messageId: string) {
  toast(`Edit · ${messageId}`);
}

function onDelete(messageId: string) {
  toast(`Delete · ${messageId}`);
}
</script>

<template>
  <Story as-child name="History">
    <div class="h-[28rem] w-[36rem]">
      <ConversationMessageList
        :messages="channelMessages"
        :intro="channelIntro"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
        @edit-description="toast('Edit description')"
        @add-people="toast('Add people')"
      />
    </div>
  </Story>
  <Story as-child name="Empty">
    <div class="h-[28rem] w-[36rem]">
      <ConversationMessageList
        :messages="[]"
        :intro="channelIntro"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
</template>
