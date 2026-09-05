<script setup lang="ts">
import { toast } from "@denser/design-system";
import { toNextPageState, toPreviousPageState } from "@/lib/async";
import { defineMeta } from "sb-addon-vue-csf";
import { channelIntro, channelMessages } from "../fixtures";
import ConversationTimeline from "../presentationals/ConversationTimeline.vue";

const firstMessageId = channelMessages[0]?.id ?? "msg-1";

const { Story } = defineMeta({
  title: "features/conversation/ConversationTimeline",
  component: ConversationTimeline,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const offLiveEdgeNextPage = toNextPageState({ hasNext: true, loadingNext: false });

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
      <ConversationTimeline
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
      <ConversationTimeline
        :messages="[]"
        :intro="channelIntro"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
  <Story as-child name="Jump to latest">
    <div class="h-[28rem] w-[36rem]">
      <ConversationTimeline
        :messages="channelMessages"
        :intro="channelIntro"
        show-jump-to-latest
        :next-page="offLiveEdgeNextPage"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
        @jump-to-latest="toast('Jump to latest')"
      />
    </div>
  </Story>
  <Story as-child name="Loading previous page">
    <div class="h-[28rem] w-[36rem]">
      <ConversationTimeline
        :messages="channelMessages"
        :intro="channelIntro"
        :previous-page="toPreviousPageState({ hasPrevious: true, loadingPrevious: true })"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
  <Story as-child name="Unread divider">
    <div class="h-[28rem] w-[36rem]">
      <ConversationTimeline
        :messages="channelMessages"
        :intro="channelIntro"
        :unread-divider-before-message-id="firstMessageId"
        @react="onReact"
        @thread="onThread"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
</template>
