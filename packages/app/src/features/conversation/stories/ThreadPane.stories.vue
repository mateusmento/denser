<script setup lang="ts">
import { toast } from "@denser/design-system";
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { defaultThreadComposerView } from "../composerActions";
import { conversationMentionItems, threadView } from "../fixtures";
import type { ComposerActionId, ScheduleCommitPayload } from "../types";
import ThreadPane from "../presentationals/ThreadPane.vue";

const { Story } = defineMeta({
  title: "features/conversation/ThreadPane",
  component: ThreadPane,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

const draft = ref<JSONContent>(emptyDoc());
const mentionItems = ref<MentionCandidate[]>([]);

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}

function onSend() {
  draft.value = emptyDoc();
}

function onSchedule(payload: ScheduleCommitPayload) {
  toast(`Reply scheduled · ${payload.whenLabel}`);
  draft.value = emptyDoc();
}

function onReact(messageId: string, emoji: string) {
  toast(`${emoji} on ${messageId}`);
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

function onClose() {
  toast("Thread closed");
}
</script>

<template>
  <Story as-child name="Open">
    <div class="h-[36rem] w-[22rem] rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
      <ThreadPane
        v-model="draft"
        :thread="threadView"
        :composer="defaultThreadComposerView()"
        :mention-items="mentionItems"
        @mention-search="onMentionSearch"
        @close="onClose"
        @send="onSend"
        @retry="onRetry"
        @schedule="onSchedule"
        @action="onAction"
        @react="onReact"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </Story>
</template>
