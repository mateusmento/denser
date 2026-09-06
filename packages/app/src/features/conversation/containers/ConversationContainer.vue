<script setup lang="ts">
import type { ArtifactId, MessageId, SpaceId, UserId } from "@denser/contracts";
import { emptyDoc, cloneDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { toast } from "@denser/design-system";
import { useQuery } from "@tanstack/vue-query";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { apiClient } from "@/lib/api";
import { buildPersonRoster, personFromUserId } from "@/modules/presence/lib/person-label";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import { useComposerAttachments } from "../composables/useComposerAttachments";
import { useMessageComposerScreenRecording } from "../composables/useMessageComposerScreenRecording";
import { useConversationMessages } from "../composables/useConversationMessages";
import { useConversationPresence } from "../composables/useConversationPresence";
import { useConversationReadState } from "../composables/useConversationReadState";
import { useConversationSync } from "../composables/useConversationSync";
import { useMessageDraftSync } from "../composables/useMessageDraftSync";
import { useThreadMessages } from "../composables/useThreadMessages";
import { channelIntro, conversationMentionItems, schedulePresets } from "../fixtures";
import { useScheduledMessagesSync } from "../composables/useScheduledMessagesSync";
import { dueAtFromScheduleCommit } from "../lib/schedule-due-at";
import ChannelHeader from "../presentationals/ChannelHeader.vue";
import ConversationSurface from "../presentationals/ConversationSurface.vue";
import ConversationTimeline from "../presentationals/ConversationTimeline.vue";
import MessageComposer from "../presentationals/MessageComposer.vue";
import ScreenRecordingSetupDialog from "../presentationals/ScreenRecordingSetupDialog.vue";
import ScreenRecordingControlsPopover from "../presentationals/ScreenRecordingControlsPopover.vue";
import ThreadPane from "../presentationals/ThreadPane.vue";
import TypingBanner from "../presentationals/TypingBanner.vue";
import ConversationPaneTabs from "../presentationals/ConversationPaneTabs.vue";
import ConversationSchedulesList from "../presentationals/ConversationSchedulesList.vue";
import ScheduledMessageEditSheet from "../presentationals/ScheduledMessageEditSheet.vue";
import type {
  ComposerActionId,
  ConversationIntroView,
  ConversationMessageView,
  ConversationPane,
  ScheduleCommitPayload,
} from "../types";
import type { ScheduledJobId } from "@denser/contracts";

const route = useRoute();
const conversationId = computed(() => route.params.conversationId as ArtifactId);
const conversationPane = ref<ConversationPane>("messages");
const editingScheduleId = ref<ScheduledJobId | null>(null);
const scheduleEditOpen = ref(false);


const conversationTitle = ref("");
const conversationSync = useConversationSync(conversationId);
conversationSync.bindComposeTitle(conversationTitle);

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

const readState = useConversationReadState(conversationId, {
  rootSpaceId: computed(() => workspaceMembersQuery.data.value?.rootSpaceId ?? null),
});

const scheduledSync = useScheduledMessagesSync(conversationId);

const messagesSync = useConversationMessages(conversationId, {
  openAnchor: computed(() => readState.openAnchor.value),
});
const timelineEdgeResetKey = computed(() => {
  const messages = messagesSync.messages.value;
  return [
    conversationId.value,
    messages[0]?.id,
    messages[messages.length - 1]?.id,
    messages.length,
    messagesSync.atStartOfHistory.value,
  ] as const;
});
const timelineRef = ref<InstanceType<typeof ConversationTimeline> | null>(null);
const pendingUnreadScroll = ref<MessageId | null>(null);

watch(
  () => readState.sessionDividerId.value,
  (messageId) => {
    if (messageId) pendingUnreadScroll.value = messageId;
  },
);

watch(
  () => [messagesSync.isLoading.value, pendingUnreadScroll.value] as const,
  async ([loading, target]) => {
    if (loading || !target) return;
    pendingUnreadScroll.value = null;
    await nextTick();
    requestAnimationFrame(() => {
      timelineRef.value?.scrollToMessage(target, { align: "center" });
    });
  },
);

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
const editingMessageId = ref<MessageId | null>(null);
const editingInThread = ref(false);

const channelDraftSync = useMessageDraftSync(conversationId, () => null, {
  enabled: () => editingMessageId.value == null || editingInThread.value,
});
const threadDraftSync = useMessageDraftSync(
  conversationId,
  () => activeThreadId.value ?? undefined,
  {
    enabled: () =>
      activeThreadId.value != null &&
      (editingMessageId.value == null || !editingInThread.value),
  },
);

channelDraftSync.bindDraft(channelDraft);
threadDraftSync.bindDraft(threadDraft);

watch(conversationId, () => {
  activeThreadId.value = null;
  threadDraft.value = emptyDoc();
});

const channelAttachments = useComposerAttachments({
  conversationId,
  body: channelDraft,
  syncDraftMetadata: (draft) => channelDraftSync.syncServerDraftMetadata(draft),
});

const screenRecording = useMessageComposerScreenRecording({
  stageFiles: (files) => channelAttachments.stageFiles(files),
  disabled: () => !conversationId.value,
});

const threadAttachments = useComposerAttachments({
  conversationId,
  threadId: activeThreadId,
  body: threadDraft,
  syncDraftMetadata: (draft) => threadDraftSync.syncServerDraftMetadata(draft),
});

const channelHeader = computed(() => {
  const viewers = presence.viewers.value;
  return {
    ...conversationSync.headerView.value,
    title: conversationTitle.value || conversationSync.headerView.value.title,
    members: viewers.slice(0, 3),
    presenceLabel: presence.presenceLabel.value,
    extraMemberCount: viewers.length > 3 ? viewers.length - 3 : undefined,
    unreadCount: readState.unreadCount.value,
  };
});

const conversationIntro = computed((): ConversationIntroView | undefined => {
  if (conversationSync.isDirect.value) {
    const title = conversationTitle.value || conversationSync.headerView.value.title;
    if (!title || title === "Loading…") return undefined;
    return {
      kind: "direct",
      title,
      body: `This is the beginning of your direct message history with ${title}.`,
    };
  }

  return channelIntro;
});

const showConversationIntro = computed(
  () =>
    !messagesSync.isLoading.value &&
    !messagesSync.isFetching.value &&
    messagesSync.atStartOfHistory.value &&
    conversationIntro.value != null,
);

const channelComposer = computed(() =>
  defaultChannelComposerView({
    schedulePresets,
    sending: messagesSync.isSending.value || messagesSync.isEditing.value,
    failed: messagesSync.failed.value,
    attachments: channelAttachments.view.value,
    isEditing: editingMessageId.value != null && !editingInThread.value,
    sendLabel: editingMessageId.value != null && !editingInThread.value ? "Save" : "Send",
  }),
);

const threadComposer = computed(() =>
  defaultThreadComposerView({
    sending: threadSync.isSending.value || messagesSync.isEditing.value,
    failed: threadSync.failed.value,
    attachments: threadAttachments.view.value,
    isEditing: editingMessageId.value != null && editingInThread.value,
    sendLabel: editingMessageId.value != null && editingInThread.value ? "Save" : "Reply",
  }),
);

function findMessage(messageId: string): ConversationMessageView | undefined {
  const fromChannel = messagesSync.messages.value.find((message) => message.id === messageId);
  if (fromChannel) return fromChannel;
  const thread = threadSync.thread.value;
  if (!thread) return undefined;
  if (thread.parent.id === messageId) return thread.parent;
  return thread.messages.find((message) => message.id === messageId);
}

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

function clearEdit() {
  editingMessageId.value = null;
  editingInThread.value = false;
}

async function onChannelSend() {
  presence.stopTyping();
  if (channelAttachments.hasBlockingUpload.value) return;

  if (editingMessageId.value && !editingInThread.value) {
    try {
      await messagesSync.edit(editingMessageId.value, channelDraft.value);
      channelDraft.value = emptyDoc();
      clearEdit();
    } catch {
      toast("Couldn't save edit");
    }
    return;
  }

  channelDraftSync.cancelPendingDraftPersist();
  const body = cloneDoc(channelDraft.value);
  const attachmentIds = channelAttachments.collectAttachmentIds(body);
  const attachmentDtos = channelAttachments.collectAttachmentDtos(body);

  try {
    if (conversationSync.isCompose.value) {
      await conversationSync.sendInitialMessage(body);
    } else {
      await messagesSync.send(body, attachmentIds, attachmentDtos);
    }
  } catch {
    toast("Couldn't send message");
    return;
  } finally {
    channelAttachments.clearAfterSend();
  }

  await channelDraftSync.clearDraft(channelDraft);
}

async function onThreadSend() {
  if (threadAttachments.hasBlockingUpload.value) return;

  if (editingMessageId.value && editingInThread.value) {
    try {
      await messagesSync.edit(editingMessageId.value, threadDraft.value);
      threadDraft.value = emptyDoc();
      clearEdit();
    } catch {
      toast("Couldn't save edit");
    }
    return;
  }

  threadDraftSync.cancelPendingDraftPersist();
  const body = cloneDoc(threadDraft.value);

  try {
    await threadSync.send(body);
  } catch {
    toast("Couldn't send reply");
    return;
  } finally {
    threadAttachments.clearAfterSend();
  }

  await threadDraftSync.clearDraft(threadDraft);
}

function onCancelChannelEdit() {
  channelDraft.value = emptyDoc();
  clearEdit();
}

function onCancelThreadEdit() {
  threadDraft.value = emptyDoc();
  clearEdit();
}

async function onSchedule(payload: ScheduleCommitPayload) {
  if (channelAttachments.hasBlockingUpload.value) return;
  const dueAt = dueAtFromScheduleCommit(payload, schedulePresets);
  try {
    await scheduledSync.schedule({
      body: channelDraft.value,
      dueAt,
      attachmentIds: channelAttachments.collectAttachmentIds(channelDraft.value),
    });
    await channelDraftSync.clearDraft(channelDraft);
    channelAttachments.clearAfterSend();
    toast(`Message scheduled · ${payload.whenLabel}`);
    conversationPane.value = "schedules";
  } catch {
    toast("Couldn't schedule message — schedule API may still be landing (#25)");
  }
}

async function onThreadSchedule(payload: ScheduleCommitPayload) {
  if (!activeThreadId.value || threadAttachments.hasBlockingUpload.value) return;
  const dueAt = dueAtFromScheduleCommit(payload, schedulePresets);
  try {
    await scheduledSync.schedule({
      body: threadDraft.value,
      dueAt,
      threadId: activeThreadId.value,
      attachmentIds: threadAttachments.collectAttachmentIds(threadDraft.value),
    });
    await threadDraftSync.clearDraft(threadDraft);
    threadAttachments.clearAfterSend();
    toast(`Reply scheduled · ${payload.whenLabel}`);
    conversationPane.value = "schedules";
  } catch {
    toast("Couldn't schedule reply — schedule API may still be landing (#25)");
  }
}

function onReact(messageId: string, emoji: string) {
  void messagesSync.toggleReaction(messageId as MessageId, emoji).catch(() => {
    toast("Couldn't update reaction");
  });
}

function onOpenThread(messageId: string) {
  activeThreadId.value = messageId as MessageId;
}

function onCloseThread() {
  activeThreadId.value = null;
}

function onEdit(messageId: string) {
  const message = findMessage(messageId);
  if (!message?.canEdit) return;

  const thread = threadSync.thread.value;
  const inThread =
    activeThreadId.value != null &&
    thread != null &&
    (thread.parent.id === messageId ||
      thread.messages.some((reply) => reply.id === messageId));

  editingMessageId.value = messageId as MessageId;
  editingInThread.value = inThread;

  if (inThread) {
    threadDraft.value = cloneDoc(message.body);
    return;
  }

  channelDraft.value = cloneDoc(message.body);
}

async function onDelete(messageId: string) {
  const message = findMessage(messageId);
  if (!message?.canDelete) return;

  try {
    await messagesSync.remove(messageId as MessageId);
  } catch {
    toast("Couldn't delete message");
  }
}

function onQuote(messageId: string) {
  toast(`Quote · ${messageId}`);
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
  if (id === "record") {
    screenRecording.openDialog();
    return;
  }
  toast(`Coming soon · ${id}`);
}

async function onJumpToLatest() {
  readState.clearDivider();
  await messagesSync.jumpToLatest();
}


const editingSchedule = computed(() =>
  scheduledSync.schedules.value.find((entry) => entry.id === editingScheduleId.value),
);

const schedulesErrorLabel = computed(() =>
  scheduledSync.error.value ? "Couldn't load scheduled messages." : undefined,
);

function onEditSchedule(id: string) {
  editingScheduleId.value = id as ScheduledJobId;
  scheduleEditOpen.value = true;
}

async function onSaveScheduleEdit(payload: { dueAtIso: string; whenLabel: string }) {
  if (!editingScheduleId.value) return;
  try {
    await scheduledSync.update({
      jobId: editingScheduleId.value,
      dueAt: payload.dueAtIso,
    });
    toast(`Schedule updated · ${payload.whenLabel}`);
  } catch {
    toast("Couldn't update schedule");
  }
}

async function onCancelSchedule(id: string) {
  try {
    await scheduledSync.cancel(id as ScheduledJobId);
    toast("Scheduled message cancelled");
  } catch {
    toast("Couldn't cancel schedule");
  }
}

async function onThreadJumpToLatest() {
  await threadSync.jumpToLatest();
}
</script>

<template>
  <ConversationSurface>
    <template #header>
      <div class="flex h-full w-full flex-col gap-1">
        <ChannelHeader :channel="channelHeader" />
        <ConversationPaneTabs v-model="conversationPane" />
      </div>
    </template>
    <template #messages>
      <ConversationSchedulesList
        v-if="conversationPane === 'schedules'"
        :schedules="scheduledSync.schedules.value"
        :loading="scheduledSync.isLoading.value"
        :error-label="schedulesErrorLabel"
        @edit="onEditSchedule"
        @cancel="onCancelSchedule"
      />
      <ConversationTimeline
        v-else
        ref="timelineRef"
        :messages="displayMessages"
        :intro="showConversationIntro ? conversationIntro : undefined"
        :previous-page="messagesSync.previousPage.value"
        :next-page="messagesSync.nextPage.value"
        :show-jump-to-latest="messagesSync.showJumpToLatest.value"
        :edge-reset-key="timelineEdgeResetKey"
        :unread-divider-before-message-id="readState.sessionDividerId.value"
        @load-previous="messagesSync.loadPrevious()"
        @load-next="messagesSync.loadNext()"
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
          v-if="conversationPane === 'messages'"
          v-model="channelDraft"
          :view="channelComposer"
          :mention-items="mentionItems"
          class="min-h-0 flex-1"
          :upload-image="channelAttachments.uploadInlineImage"
          :on-stage-files="(files) => channelAttachments.stageFiles(files)"
          :can-send="channelAttachments.hasSendableContent(channelDraft)"
          @mention-search="onMentionSearch"
          @send="onChannelSend"
          @cancel-edit="onCancelChannelEdit"
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
        @cancel-edit="onCancelThreadEdit"
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
    <ScheduledMessageEditSheet
      v-model:open="scheduleEditOpen"
      :message="editingSchedule"
      :presets="schedulePresets"
      @save="onSaveScheduleEdit"
    />
  </ConversationSurface>

  <ScreenRecordingSetupDialog
    v-model:open="screenRecording.open"
    :view="screenRecording.setupView"
    :preview-canvas="screenRecording.previewCanvas"
    @cancel="screenRecording.onCancel()"
    @start="screenRecording.onStart()"
    @stop="screenRecording.onStop()"
    @minimize="screenRecording.onMinimize()"
    @move-camera="screenRecording.onMoveCamera($event)"
    @resize-camera="screenRecording.onResizeCamera($event)"
    @update:webcam-enabled="screenRecording.setWebcamEnabled($event)"
    @update:mic-enabled="screenRecording.setMicEnabled($event)"
    @update:system-audio-enabled="screenRecording.setSystemAudioEnabled($event)"
  />

  <ScreenRecordingControlsPopover
    :visible="screenRecording.controlsPopoverVisible"
    :view="screenRecording.setupView"
    :preview-canvas="screenRecording.previewCanvas"
    @stop="screenRecording.onStop()"
    @open-dialog="screenRecording.onOpenDialogDuringRecording()"
  />
</template>
