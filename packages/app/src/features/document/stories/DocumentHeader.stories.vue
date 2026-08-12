<script setup lang="ts">
import { defineMeta } from "sb-addon-vue-csf";
import { readyDocumentView } from "../fixtures";
import DocumentHeader from "../presentationals/DocumentHeader.vue";

const { Story } = defineMeta({
  title: "features/document/DocumentHeader",
  component: DocumentHeader,
  tags: ["autodocs"],
});
</script>

<template>
  <Story as-child name="Default">
    <div class="h-surface-header w-[36rem]">
      <DocumentHeader :header="readyDocumentView.header" />
    </div>
  </Story>
</template>
