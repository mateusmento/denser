<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import DraftOutboxRow from "../presentationals/DraftOutboxRow.vue";
import type { DraftOutboxRowView } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/DraftOutboxRow",
  component: DraftOutboxRow,
  tags: ["autodocs"],
});

const channelDraft: DraftOutboxRowView = {
  id: "draft-1",
  conversationId: "conv-1",
  threadId: null,
  conversationLabel: "#engineering",
  contextLabel: "channel",
  bodyPreview: "Quick reminder: please review the RFC before standup tomorrow.",
};

const threadDraft: DraftOutboxRowView = {
  id: "draft-2",
  conversationId: "conv-1",
  threadId: "msg-thread-root",
  conversationLabel: "#engineering",
  contextLabel: "thread",
  bodyPreview: "Replying in thread with a longer preview that should clamp after two lines in the row layout.",
};

const dmDraft: DraftOutboxRowView = {
  id: "draft-3",
  conversationId: "conv-dm",
  threadId: null,
  conversationLabel: "DM with Alex",
  contextLabel: "channel",
  bodyPreview: "Can we sync on the rollout plan this afternoon?",
};
</script>

<template>
  <Story as-child name="Channel">
    <DraftOutboxRow :item="channelDraft" />
  </Story>
  <Story as-child name="Thread">
    <DraftOutboxRow :item="threadDraft" />
  </Story>
  <Story as-child name="DirectMessage">
    <DraftOutboxRow :item="dmDraft" />
  </Story>
</template>
