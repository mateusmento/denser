<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { defaultThreadComposerView } from "../composerActions";
import { conversationMentionItems, threadView } from "../fixtures";
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
      />
    </div>
  </Story>
</template>
