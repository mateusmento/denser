<script setup lang="ts">
import type { ArtifactId, MessageId } from "@denser/contracts";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { toast } from "@denser/design-system";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import { useConversationMessages } from "../composables/useConversationMessages";
import { useConversationSync } from "../composables/useConversationSync";
import { useThreadMessages } from "../composables/useThreadMessages";
import { channelIntro, conversationMentionItems, schedulePresets } from "../fixtures";
import ConversationSurface from "../presentationals/ConversationSurface.vue";
import ConversationTimeline from "../presentationals/ConversationTimeline.vue";
import MessageComposer from "../presentationals/MessageComposer.vue";
import ThreadPane from "../presentationals/ThreadPane.vue";
import TitleEditor from "@/features/document/presentationals/TitleEditor.vue";
import type { ComposerActionId, ScheduleCommitPayload } from "../types";

const route = useRoute();
const conversationId = computed(() => route.params.conversationId as ArtifactId);

const conversationTitle = ref("");
const conversationSync = useConversationSync(conversationId);
conversationSync.bindComposeTitle(conversationTitle);

const messagesSync = useConversationMessages(conversationId);
const timelineRef = ref<InstanceType<typeof ConversationTimeline> | null>(null);

const channelDraft = ref<JSONContent>(emptyDoc());
const threadDraft = ref<JSONContent>(emptyDoc());
const activeThreadId = ref<MessageId | null>(null);

const threadParent = computed(() =>
  activeThreadId.value
    ? messagesSync.messages.value.find((message) => message.id === activeThreadId.value)
    : undefined,
);

const threadSync = useThreadMessages(conversationId, activeThreadId, threadParent);

const mentionItems = ref<MentionCandidate[]>([]);

watch(conversationId, () => {
  activeThreadId.value = null;
  threadDraft.value = emptyDoc();
});

const channelComposer = computed(() =>
  defaultChannelComposerView({
    schedulePresets,
    sending: messagesSync.isSending.value,
    failed: messagesSync.failed.value,
  }),
);
const threadComposer = computed(() =>
  defaultThreadComposerView({
    sending: threadSync.isSending.value,
    failed: threadSync.failed.value,
  }),
);

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

async function onChannelSend() {
  if (conversationSync.isCompose.value) {
    await conversationSync.sendInitialMessage(channelDraft.value);
    channelDraft.value = emptyDoc();
    return;
  }
  await messagesSync.send(channelDraft.value);
  channelDraft.value = emptyDoc();
}

async function onThreadSend() {
  await threadSync.send(threadDraft.value);
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
  activeThreadId.value = messageId as MessageId;
}

function onCloseThread() {
  activeThreadId.value = null;
  threadDraft.value = emptyDoc();
}

function onEdit(messageId: string) {
  toast(`Edit · ${messageId}`);
}

function onDelete(messageId: string) {
  toast(`Delete · ${messageId}`);
}

function onCopyLink(messageId: string) {
  toast(`Copy link · ${messageId}`);
}

function onBookmark(messageId: string) {
  toast(`Bookmark · ${messageId}`);
}

function onForward(messageId: string) {
  toast(`Forward · ${messageId}`);
}

function onQuote(messageId: string) {
  toast(`Quote · ${messageId}`);
}

async function onJumpQuote(messageId: string) {
  await messagesSync.jumpAround(messageId as MessageId);
  await nextTick();
  requestAnimationFrame(() => {
    timelineRef.value?.scrollToMessage(messageId, { align: "center" });
  });
}

function onEditDescription() {
  toast("Edit description");
}

function onAddPeople() {
  toast("Add people");
}

async function onRetry() {
  await messagesSync.retrySend();
}

async function onThreadRetry() {
  await threadSync.retrySend();
}

function onAction(id: ComposerActionId) {
  toast(`Coming soon · ${id}`);
}

async function onJumpToLatest() {
  await messagesSync.jumpToLatest();
}

async function onThreadJumpToLatest() {
  await threadSync.jumpToLatest();
}
</script>

<template>
  <ConversationSurface>
    <template #header>
      <div class="flex h-full w-full items-center px-2">
        <TitleEditor v-model="conversationTitle" placeholder="Untitled" editable />
      </div>
    </template>
    <template #messages>
      <ConversationTimeline
        ref="timelineRef"
        :messages="messagesSync.messages.value"
        :intro="channelIntro"
        :previous-page="messagesSync.previousPage.value"
        :next-page="messagesSync.nextPage.value"
        :show-jump-to-latest="messagesSync.showJumpToLatest.value"
        @load-previous="messagesSync.loadPrevious()"
        @jump-to-latest="onJumpToLatest"
        @react="onReact"
        @thread="onOpenThread"
        @copy-link="onCopyLink"
        @bookmark="onBookmark"
        @forward="onForward"
        @quote="onQuote"
        @jump-quote="onJumpQuote"
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
    <template v-if="activeThreadId && threadSync.thread.value" #thread>
      <ThreadPane
        v-model="threadDraft"
        :thread="threadSync.thread.value"
        :composer="threadComposer"
        :mention-items="mentionItems"
        :previous-page="threadSync.previousPage.value"
        :next-page="threadSync.nextPage.value"
        :show-jump-to-latest="threadSync.showJumpToLatest.value"
        @mention-search="onMentionSearch"
        @close="onCloseThread"
        @send="onThreadSend"
        @retry="onThreadRetry"
        @schedule="onThreadSchedule"
        @action="onAction"
        @react="onReact"
        @copy-link="onCopyLink"
        @bookmark="onBookmark"
        @forward="onForward"
        @quote="onQuote"
        @jump-quote="onJumpQuote"
        @edit="onEdit"
        @delete="onDelete"
        @load-previous="threadSync.loadPrevious()"
        @jump-to-latest="onThreadJumpToLatest"
      />
    </template>
  </ConversationSurface>
</template>
