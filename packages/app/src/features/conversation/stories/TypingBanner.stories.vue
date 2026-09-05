<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import TypingBanner from "../presentationals/TypingBanner.vue";

const { Story } = defineMeta({
  title: "features/conversation/TypingBanner",
  component: TypingBanner,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Single">
    <div class="w-[36rem]">
      <TypingBanner label="Ava Chen is typing…" />
    </div>
  </Story>
  <Story as-child name="Multiple">
    <div class="w-[36rem]">
      <TypingBanner label="Ava Chen and Jon Park are typing…" />
    </div>
  </Story>
</template>
