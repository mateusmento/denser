<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { featureTourDoc } from "../fixtures";
import RichTextPreview from "../presentationals/RichTextPreview.vue";

const { Story } = defineMeta({
  title: "modules/rich-text/RichTextPreview",
  component: RichTextPreview,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
});
</script>

<template>
  <Story as-child name="Document">
    <div class="w-[36rem]">
      <RichTextPreview :doc="featureTourDoc" />
    </div>
  </Story>
</template>
