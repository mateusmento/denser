<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import { emptyDoc, type JSONContent, type MentionCandidate } from "@/modules/rich-text";
import { defaultChannelComposerView, defaultThreadComposerView } from "../composerActions";
import { conversationMentionItems, schedulePresets } from "../fixtures";
import MessageComposer from "../presentationals/MessageComposer.vue";

const { Story } = defineMeta({
  title: "features/conversation/MessageComposer",
  component: MessageComposer,
  tags: ["autodocs"],
});

const draft = ref<JSONContent>(emptyDoc());
const mentionItems = ref<MentionCandidate[]>([]);

function onMentionSearch(query: string) {
  mentionItems.value = conversationMentionItems(query);
}
</script>

<template>
  <Story as-child name="Channel">
    <div class="h-40 w-[36rem]">
      <MessageComposer
        v-model="draft"
        :view="defaultChannelComposerView({ schedulePresets })"
        :mention-items="mentionItems"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
  <Story as-child name="Thread">
    <div class="h-40 w-[22rem]">
      <MessageComposer
        v-model="draft"
        :view="defaultThreadComposerView()"
        :mention-items="mentionItems"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
  <Story as-child name="Failed">
    <div class="h-40 w-[36rem]">
      <MessageComposer
        v-model="draft"
        :view="defaultChannelComposerView({ failed: true, schedulePresets })"
      />
    </div>
  </Story>
  <Story as-child name="Narrow">
    <div class="h-40 w-64">
      <MessageComposer
        v-model="draft"
        :view="defaultChannelComposerView({ schedulePresets })"
        :mention-items="mentionItems"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
</template>
