<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import { conversationMessageGroups } from "../messageGrouping";
import ConversationMessage from "../presentationals/ConversationMessage.vue";
import ConversationMessageGroup from "../presentationals/ConversationMessageGroup.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationMessageGroup",
  component: ConversationMessageGroup,
  tags: ["autodocs"],
});

const sampleGroup = conversationMessageGroups(channelMessages).find((g) => g.messages.length > 1)
  ?? conversationMessageGroups(channelMessages)[0]!;
</script>

<template>
  <Story as-child name="Cluster">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="sampleGroup.author"
        :created-at-label="sampleGroup.createdAtLabel"
      >
        <ConversationMessage
          v-for="message in sampleGroup.messages"
          :key="message.id"
          :message="message"
          @react="toast($event)"
          @thread="toast('Thread')"
          @edit="toast('Edit')"
          @delete="toast('Delete')"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
</template>
