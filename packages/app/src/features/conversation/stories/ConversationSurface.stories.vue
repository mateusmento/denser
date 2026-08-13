<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import {
  channelHeader,
  channelMessages,
  conversationMentionItems,
  schedulePresets,
  threadView,
} from "../fixtures";
import type { ComposerActionId, ScheduleCommitPayload } from "../types";
import ChannelHeader from "../presentationals/ChannelHeader.vue";
import ConversationMessageList from "../presentationals/ConversationMessageList.vue";
import ConversationSurface from "../presentationals/ConversationSurface.vue";
import MessageComposer from "../presentationals/MessageComposer.vue";
import PermissionEmpty from "../presentationals/PermissionEmpty.vue";
import ThreadPane from "../presentationals/ThreadPane.vue";

const { Story } = defineMeta({
  title: "features/conversation/ConversationSurface",
  component: ConversationSurface,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const channelDraft = ref<JSONContent>(emptyDoc());
const threadDraft = ref<JSONContent>(emptyDoc());
const threadOpen = ref(true);

const channelComposer = defaultChannelComposerView({ schedulePresets });
const threadComposer = defaultThreadComposerView();
const mentionItems = ref<MentionCandidate[]>([]);

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

function onChannelSend() {
  channelDraft.value = emptyDoc();
}

function onThreadSend() {
  threadDraft.value = emptyDoc();
}

function onSchedule(payload: ScheduleCommitPayload) {
  toast(`Message scheduled · ${payload.whenLabel}`);
  channelDraft.value = emptyDoc();
}

function onThreadSchedule(payload: ScheduleCommitPayload) {
  toast(`Reply scheduled · ${payload.whenLabel}`);
  threadDraft.value = emptyDoc();
}

function onReact(messageId: string, emoji: string) {
  toast(`${emoji} on ${messageId}`);
}

function onOpenThread(messageId: string) {
  toast(`Thread · ${messageId}`);
  threadOpen.value = true;
}

function onEdit(messageId: string) {
  toast(`Edit · ${messageId}`);
}

function onDelete(messageId: string) {
  toast(`Delete · ${messageId}`);
}

function onRetry() {
  toast("Retrying…");
}

function onAction(id: ComposerActionId) {
  toast(`Coming soon · ${id}`);
}
</script>

<template>
  <Story as-child name="Ready">
    <div class="flex h-[40rem]">
      <ConversationSurface>
        <template #header>
          <ChannelHeader :channel="channelHeader" />
        </template>
        <template #messages>
          <ConversationMessageList
            :messages="channelMessages"
            @react="onReact"
            @thread="onOpenThread"
            @edit="onEdit"
            @delete="onDelete"
          />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onChannelSend"
            @retry="onRetry"
            @schedule="onSchedule"
            @action="onAction"
          />
        </template>
      </ConversationSurface>
    </div>
  </Story>
  <Story as-child name="ThreadOpen">
    <div class="flex h-[40rem]">
      <ConversationSurface>
        <template #header>
          <ChannelHeader :channel="channelHeader" />
        </template>
        <template #messages>
          <ConversationMessageList
            :messages="channelMessages"
            @react="onReact"
            @thread="onOpenThread"
            @edit="onEdit"
            @delete="onDelete"
          />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onChannelSend"
            @retry="onRetry"
            @schedule="onSchedule"
            @action="onAction"
          />
        </template>
        <template v-if="threadOpen" #thread>
          <ThreadPane
            v-model="threadDraft"
            :thread="threadView"
            :composer="threadComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @close="threadOpen = false"
            @send="onThreadSend"
            @retry="onRetry"
            @schedule="onThreadSchedule"
            @action="onAction"
            @react="onReact"
            @edit="onEdit"
            @delete="onDelete"
          />
        </template>
      </ConversationSurface>
    </div>
  </Story>
  <Story as-child name="EmptyChannel">
    <div class="flex h-[40rem]">
      <ConversationSurface>
        <template #header>
          <ChannelHeader :channel="channelHeader" />
        </template>
        <template #messages>
          <ConversationMessageList
            :messages="[]"
            @react="onReact"
            @thread="onOpenThread"
            @edit="onEdit"
            @delete="onDelete"
          />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onChannelSend"
            @retry="onRetry"
            @schedule="onSchedule"
            @action="onAction"
          />
        </template>
      </ConversationSurface>
    </div>
  </Story>
  <Story as-child name="NoPostPermission">
    <div class="flex h-[40rem]">
      <ConversationSurface>
        <template #header>
          <ChannelHeader :channel="channelHeader" />
        </template>
        <template #messages>
          <ConversationMessageList
            :messages="channelMessages"
            @react="onReact"
            @thread="onOpenThread"
            @edit="onEdit"
            @delete="onDelete"
          />
        </template>
        <template #composer>
          <PermissionEmpty />
        </template>
      </ConversationSurface>
    </div>
  </Story>
</template>
