<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { channelMessages } from "../fixtures";
import ConversationMessage from "../presentationals/ConversationMessage.vue";
import ConversationMessageGroup from "../presentationals/ConversationMessageGroup.vue";

const { Story } = defineMeta({
  title: "features/conversation/MessageHoverMenu",
  component: ConversationMessage,
  tags: ["autodocs"],
});

const editable = channelMessages[4] ?? channelMessages[0]!;
const readOnly = channelMessages[0]!;
</script>

<template>
  <Story as-child name="Editable">
    <div class="w-lg">
      <p class="mb-2 text-xs text-muted-foreground">Hover the message to reveal actions</p>
      <ConversationMessageGroup
        :author="editable.author"
        :created-at-label="editable.createdAtLabel"
      >
        <ConversationMessage
          :message="editable"
          @react="toast(`React · ${$event}`)"
          @thread="toast(`Thread · ${editable.id}`)"
          @quote="toast(`Quote · ${editable.id}`)"
          @edit="toast(`Edit · ${editable.id}`)"
          @delete="toast(`Delete · ${editable.id}`)"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
  <Story as-child name="ReadOnly">
    <div class="w-lg">
      <ConversationMessageGroup
        :author="readOnly.author"
        :created-at-label="readOnly.createdAtLabel"
      >
        <ConversationMessage
          :message="readOnly"
          @react="toast(`React · ${$event}`)"
          @thread="toast(`Thread · ${readOnly.id}`)"
          @quote="toast(`Quote · ${readOnly.id}`)"
        />
      </ConversationMessageGroup>
    </div>
  </Story>
</template>
