<script setup lang="ts">
import type { ArtifactId } from "@denser/contracts";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { toast } from "@denser/design-system";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import { useConversationSync } from "../composables/useConversationSync";
import {
  channelIntro,
  channelMessages,
  conversationMentionItems,
  schedulePresets,
  threadView,
} from "../fixtures";
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

const channelDraft = ref<JSONContent>(emptyDoc());
const threadDraft = ref<JSONContent>(emptyDoc());
const threadOpen = ref(false);
const mentionItems = ref<MentionCandidate[]>([]);

const channelComposer = defaultChannelComposerView({ schedulePresets });
const threadComposer = defaultThreadComposerView();

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

async function onChannelSend() {
  await conversationSync.sendInitialMessage(channelDraft.value);
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
      <div class="flex h-full w-full items-center px-2">
        <TitleEditor v-model="conversationTitle" placeholder="Untitled" editable />
      </div>
    </template>
    <template #messages>
      <ConversationTimeline
        :messages="channelMessages"
        :intro="channelIntro"
        @react="onReact"
        @thread="onOpenThread"
        @copy-link="onCopyLink"
        @bookmark="onBookmark"
        @forward="onForward"
        @quote="onQuote"
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
        @copy-link="onCopyLink"
        @bookmark="onBookmark"
        @forward="onForward"
        @quote="onQuote"
        @edit="onEdit"
        @delete="onDelete"
      />
    </template>
  </ConversationSurface>
</template>
