<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import {
  channelMessages,
  messageWithAttachmentQuote,
  messageWithLongQuote,
  messageWithShortQuote,
} from "../messageFixtures";
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

function onJumpQuote(messageId: string) {
  toast(`Jump to quote · ${messageId}`);
}

const lead = channelMessages[0]!;
const withThread = channelMessages[1]!;
const withAttachments = channelMessages.find((message) => message.id === "m-attachments")!;
const editable = channelMessages[4] ?? channelMessages[0]!;
const shortQuote = messageWithShortQuote;
const longQuote = messageWithLongQuote;
const attachmentQuote = messageWithAttachmentQuote;
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
  <Story as-child name="WithAttachments">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="withAttachments.author"
        :created-at-label="withAttachments.createdAtLabel"
      >
        <ConversationMessage
          :message="withAttachments"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="Editable">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="editable.author"
        :created-at-label="editable.createdAtLabel"
      >
        <ConversationMessage
          :message="editable"
          @react="onReact"
          @thread="onThread"
          @quote="toast('Quote')"
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
  <Story as-child name="WithShortQuote">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="shortQuote.author"
        :created-at-label="shortQuote.createdAtLabel"
      >
        <ConversationMessage
          :message="shortQuote"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
          @jump-quote="onJumpQuote"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="WithLongQuote">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="longQuote.author"
        :created-at-label="longQuote.createdAtLabel"
      >
        <ConversationMessage
          :message="longQuote"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
          @jump-quote="onJumpQuote"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="WithAttachmentQuote">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="attachmentQuote.author"
        :created-at-label="attachmentQuote.createdAtLabel"
      >
        <ConversationMessage
          :message="attachmentQuote"
          @react="onReact"
          @thread="onThread"
          @edit="onEdit"
          @delete="onDelete"
          @jump-quote="onJumpQuote"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
</template>
