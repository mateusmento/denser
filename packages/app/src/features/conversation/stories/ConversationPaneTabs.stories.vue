<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import ConversationPaneTabs from "../presentationals/ConversationPaneTabs.vue";
import type { ConversationPane } from "../types";

const { Story } = defineMeta({
  title: "features/conversation/ConversationPaneTabs",
  component: ConversationPaneTabs,
  tags: ["autodocs"],
});

const pane = ref<ConversationPane>("messages");
</script>

<template>
  <Story as-child name="Default">
    <ConversationPaneTabs v-model="pane" />
  </Story>
</template>
