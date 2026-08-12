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

function onSend() {
  channelDraft.value = emptyDoc();
}

function onSchedule() {
  toast("Message scheduled");
  channelDraft.value = emptyDoc();
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
          <ConversationMessageList :messages="channelMessages" />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onSend"
            @schedule="onSchedule"
            @action="toast('Coming soon')"
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
          <ConversationMessageList :messages="channelMessages" @thread="threadOpen = true" />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
            @send="onSend"
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
            @send="threadDraft = emptyDoc()"
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
          <ConversationMessageList :messages="[]" />
        </template>
        <template #composer>
          <MessageComposer
            v-model="channelDraft"
            :view="channelComposer"
            :mention-items="mentionItems"
            @mention-search="onMentionSearch"
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
          <ConversationMessageList :messages="channelMessages" />
        </template>
        <template #composer>
          <PermissionEmpty />
        </template>
      </ConversationSurface>
    </div>
  </Story>
</template>
