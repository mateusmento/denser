<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import {
  emptyDoc,
  featureTourDoc,
  type JSONContent,
  type MentionCandidate,
} from "@/modules/rich-text";
import { documentMentionItems } from "../fixtures";
import DocumentComposer from "../presentationals/DocumentComposer.vue";

const { Story } = defineMeta({
  title: "features/document/DocumentComposer",
  component: DocumentComposer,
  tags: ["autodocs"],
});

const empty = ref<JSONContent>(emptyDoc());
const editing = ref<JSONContent>(structuredClone(featureTourDoc));
const reading = ref<JSONContent>(structuredClone(featureTourDoc));
const mentionItems = ref<MentionCandidate[]>([]);

function onMentionSearch(query: string) {
  mentionItems.value = documentMentionItems(query);
}

async function uploadImage(file: File) {
  return URL.createObjectURL(file);
}
</script>

<template>
  <Story as-child name="Edit">
    <div class="w-[36rem]">
      <DocumentComposer
        v-model="editing"
        placeholder="Start writing…"
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
  <Story as-child name="ReadOnly">
    <div class="w-[36rem]">
      <DocumentComposer v-model="reading" :editable="false" />
    </div>
  </Story>
  <Story as-child name="Empty">
    <div class="w-[36rem]">
      <DocumentComposer
        v-model="empty"
        placeholder="Start writing…"
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
</template>
