<script setup lang="ts">
import type { ArtifactId, MessageId, SpaceId, UserId } from "@denser/contracts";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { toast } from "@denser/design-system";
import { useQuery } from "@tanstack/vue-query";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { apiClient } from "@/lib/api";
import { buildPersonRoster, personFromUserId } from "@/modules/presence/lib/person-label";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import { useComposerAttachments } from "../composables/useComposerAttachments";
import { useConversationMessages } from "../composables/useConversationMessages";
import { useConversationPresence } from "../composables/useConversationPresence";
import { useConversationSync } from "../composables/useConversationSync";
import { useThreadMessages } from "../composables/useThreadMessages";
import { channelIntro, conversationMentionItems, schedulePresets } from "../fixtures";
import ChannelHeader from "../presentationals/ChannelHeader.vue";
import ConversationSurface from "../presentationals/ConversationSurface.vue";
import ConversationTimeline from "../presentationals/ConversationTimeline.vue";
import MessageComposer from "../presentationals/MessageComposer.vue";
import ThreadPane from "../presentationals/ThreadPane.vue";
import TypingBanner from "../presentationals/TypingBanner.vue";
import type { ComposerActionId, ScheduleCommitPayload } from "../types";

const route = useRoute();
const conversationId = computed(() => route.params.conversationId as ArtifactId);

const conversationTitle = ref("");
const conversationSync = useConversationSync(conversationId);
conversationSync.bindComposeTitle(conversationTitle);

const messagesSync = useConversationMessages(conversationId);
const timelineRef = ref<InstanceType<typeof ConversationTimeline> | null>(null);

const workspaceMembersQuery = useQuery({
  queryKey: computed(() => ["conversation-roster", conversationId.value] as const),
  enabled: computed(() => conversationId.value != null),
  queryFn: async () => {
    const { conversation } = await apiClient.getConversation(conversationId.value!);
    const rootSpaceId = conversation.rootSpaceId;
    if (!rootSpaceId) return { members: [], rootSpaceId: null as SpaceId | null };
    const detail = await apiClient.getSpace(rootSpaceId);
    return { members: detail.assignableMembers ?? detail.members, rootSpaceId };
  },
});

const roster = computed(() =>
  buildPersonRoster(
    workspaceMembersQuery.data.value?.members ?? [],
    messagesSync.messages.value,
  ),
);

const displayMessages = computed(() =>
  messagesSync.messages.value.map((message) => ({
    ...message,
    author: personFromUserId(message.author.id as UserId, roster.value),
  })),
);

const presence = useConversationPresence(conversationId, {
  members: computed(() => workspaceMembersQuery.data.value?.members ?? []),
  messages: computed(() => messagesSync.messages.value),
});

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

const channelAttachments = useComposerAttachments({
  conversationId,
  body: channelDraft,
});

const threadAttachments = useComposerAttachments({
  conversationId,
  threadId: activeThreadId,
  body: threadDraft,
});

const channelHeader = computed(() => {
  const viewers = presence.viewers.value;
  return {
    ...conversationSync.headerView.value,
    title: conversationTitle.value || conversationSync.headerView.value.title,
    members: viewers.slice(0, 3),
    presenceLabel: presence.presenceLabel.value,
    extraMemberCount: viewers.length > 3 ? viewers.length - 3 : undefined,
  };
});

const showChannelIntro = computed(() => !conversationSync.isDirect.value);

const channelComposer = computed(() =>
  defaultChannelComposerView({
    schedulePresets,
    sending: messagesSync.isSending.value,
    failed: messagesSync.failed.value,
    attachments: channelAttachments.view.value,
  }),
);

const threadComposer = computed(() =>
  defaultThreadComposerView({
    sending: threadSync.isSending.value,
    failed: threadSync.failed.value,
    attachments: threadAttachments.view.value,
  }),
);

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

async function onChannelSend() {
  presence.stopTyping();
  if (channelAttachments.hasBlockingUpload.value) return;
  const attachmentIds = channelAttachments.collectAttachmentIds(channelDraft.value);

  if (conversationSync.isCompose.value) {
    await conversationSync.sendInitialMessage(channelDraft.value);
    channelDraft.value = emptyDoc();
    channelAttachments.clearAfterSend();
    return;
  }

  await messagesSync.send(
    channelDraft.value,
    attachmentIds,
    channelAttachments.collectAttachmentDtos(channelDraft.value),
  );
  channelDraft.value = emptyDoc();
  channelAttachments.clearAfterSend();
}

async function onThreadSend() {
  if (threadAttachments.hasBlockingUpload.value) return;
  await threadSync.send(threadDraft.value);
  threadDraft.value = emptyDoc();
  threadAttachments.clearAfterSend();
}

function onSchedule(payload: ScheduleCommitPayload) {
  toast(`Message scheduled · ${payload.whenLabel}`);
  channelDraft.value = emptyDoc();
  channelAttachments.clearAfterSend();
}

function onThreadSchedule(payload: ScheduleCommitPayload) {
  toast(`Reply scheduled · ${payload.whenLabel}`);
  threadDraft.value = emptyDoc();
  threadAttachments.clearAfterSend();
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
  if (id === "attach" || id === "image") return;
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
      <div class="h-full w-full">
        <ChannelHeader :channel="channelHeader" />
      </div>
    </template>
    <template #messages>
      <ConversationTimeline
        ref="timelineRef"
        :messages="displayMessages"
        :intro="showChannelIntro ? channelIntro : undefined"
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
      <div class="flex min-h-0 flex-1 flex-col">
        <TypingBanner v-if="presence.typingLabel.value" :label="presence.typingLabel.value" />
        <MessageComposer
          v-model="channelDraft"
          :view="channelComposer"
          :mention-items="mentionItems"
          class="min-h-0 flex-1"
          :upload-image="channelAttachments.uploadInlineImage"
          :on-stage-files="(files) => channelAttachments.stageFiles(files)"
          :can-send="channelAttachments.hasSendableContent(channelDraft)"
          @mention-search="onMentionSearch"
          @send="onChannelSend"
          @retry="onRetry"
          @schedule="onSchedule"
          @action="onAction"
          @typing="presence.notifyTyping()"
          @typing-stop="presence.stopTyping()"
          @remove-attachment="channelAttachments.removeTile"
          @cancel-upload="channelAttachments.cancelUpload"
          @retry-upload="channelAttachments.retryUpload"
          @dismiss-upload="channelAttachments.dismissFailed"
        />
      </div>
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
        :upload-image="threadAttachments.uploadInlineImage"
        :on-stage-files="(files) => threadAttachments.stageFiles(files)"
        :can-send="threadAttachments.hasSendableContent(threadDraft)"
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
        @remove-attachment="threadAttachments.removeTile"
        @cancel-upload="threadAttachments.cancelUpload"
        @retry-upload="threadAttachments.retryUpload"
        @dismiss-upload="threadAttachments.dismissFailed"
      />
    </template>
  </ConversationSurface>
</template>
