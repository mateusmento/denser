<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { ref } from "vue";
import TitleEditor from "../presentationals/TitleEditor.vue";

const { Story } = defineMeta({
  title: "features/document/TitleEditor",
  component: TitleEditor,
  tags: ["autodocs"],
});

const title = ref("Onboarding notes");
</script>

<template>
  <Story as-child name="Default">
    <div class="w-[28rem]">
      <TitleEditor v-model="title" />
    </div>
  </Story>
</template>
