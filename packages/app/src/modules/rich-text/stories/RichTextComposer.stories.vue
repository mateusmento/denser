<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import RichTextComposer from "../presentationals/RichTextComposer.vue";
import { emptyDoc, paragraphDoc, type JSONContent, type MentionCandidate } from "../types";

const { Story } = defineMeta({
  title: "modules/rich-text/RichTextComposer",
  component: RichTextComposer,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});

const drafting = ref<JSONContent>(emptyDoc());
const seeded = ref<JSONContent>(paragraphDoc("Select this sentence to format it."));
const withCode = ref<JSONContent>({
  type: "doc",
  content: [
    {
      type: "codeBlock",
      attrs: { language: "ts" },
      content: [
        {
          type: "text",
          text: "const ready = true;\nfunction greet(name: string) {\n  return `hi ${name}`;\n}\n",
        },
      ],
    },
  ],
});
const mentionItems = ref<MentionCandidate[]>([]);

const people: MentionCandidate[] = [
  { id: "u-ava", label: "Ava Chen" },
  { id: "u-jon", label: "Jon Park" },
  { id: "u-mia", label: "Mia Rossi" },
];

function onMentionSearch(query: string) {
  const q = query.trim().toLowerCase();
  mentionItems.value = q
    ? people.filter((person) => person.label.toLowerCase().includes(q))
    : [...people];
}

async function uploadImage(file: File) {
  return URL.createObjectURL(file);
}
</script>

<template>
  <Story as-child name="Empty">
    <div class="w-[36rem] rounded-md border border-border p-3">
      <RichTextComposer
        v-model="drafting"
        placeholder="Write a page…"
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
  <Story as-child name="Selection">
    <div class="w-[36rem] rounded-md border border-border p-3">
      <RichTextComposer
        v-model="seeded"
        :mention-items="mentionItems"
        :upload-image="uploadImage"
        @mention-search="onMentionSearch"
      />
    </div>
  </Story>
  <Story as-child name="CodeBlock">
    <div class="w-[36rem] rounded-md border border-border p-3">
      <RichTextComposer v-model="withCode" :mention-items="mentionItems" />
    </div>
  </Story>
  <Story as-child name="Disabled">
    <div class="w-[36rem] rounded-md border border-border p-3">
      <RichTextComposer v-model="seeded" disabled />
    </div>
  </Story>
</template>
