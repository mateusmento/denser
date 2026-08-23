<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessage from "../presentationals/ConversationMessage.vue";
import ConversationMessageGroup from "../presentationals/ConversationMessageGroup.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessage",
  component: ConversationMessage,
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

const lead = channelMessages[0]!;
const withThread = channelMessages[1]!;
</script>

<template>
  <Story as-child name="Lead">
    <div class="w-lg">
      <ConversationMessageGroup :author="lead.author" :created-at-label="lead.createdAtLabel">
        <ConversationMessage
          :message="lead"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="WithThread">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="withThread.author"
        :created-at-label="withThread.createdAtLabel"
      >
        <ConversationMessage
          :message="withThread"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="InThreadPane">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="withThread.author"
        :created-at-label="withThread.createdAtLabel"
      >
        <ConversationMessage
          :message="withThread"
          :thread-actions="false"
          @react="onReact"
          @edit="onEdit"
          @delete="onDelete"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
</template>
