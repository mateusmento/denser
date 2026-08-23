<script setup lang="ts">
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { toast } from "@denser/design-system";
import { ref } from "vue";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import {
  channelHeader,
  channelIntro,
  channelMessages,
  conversationMentionItems,
  schedulePresets,
  threadView,
} from "../fixtures";
import ChannelHeader from "../presentationals/ChannelHeader.vue";
import ConversationSurface from "../presentationals/ConversationSurface.vue";
import ConversationTimeline from "../presentationals/ConversationTimeline.vue";
import MessageComposer from "../presentationals/MessageComposer.vue";
import ThreadPane from "../presentationals/ThreadPane.vue";
import type { ComposerActionId, ScheduleCommitPayload } from "../types";

const channelDraft = ref<JSONContent>(emptyDoc());
const threadDraft = ref<JSONContent>(emptyDoc());
const threadOpen = ref(false);
const mentionItems = ref<MentionCandidate[]>([]);

const channelComposer = defaultChannelComposerView({ schedulePresets });
const threadComposer = defaultThreadComposerView();

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

function onEditDescription() {
  toast("Edit description");
}

function onAddPeople() {
  toast("Add people");
}

function onRetry() {
  toast("Retrying…");
}

function onAction(id: ComposerActionId) {
  toast(`Coming soon · ${id}`);
}
</script>

<template>
  <ConversationSurface>
    <template #header>
      <ChannelHeader :channel="channelHeader" />
    </template>
    <template #messages>
      <ConversationTimeline
        :messages="channelMessages"
        :intro="channelIntro"
        @react="onReact"
        @thread="onOpenThread"
        @edit="onEdit"
        @delete="onDelete"
        @edit-description="onEditDescription"
        @add-people="onAddPeople"
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
</template>
