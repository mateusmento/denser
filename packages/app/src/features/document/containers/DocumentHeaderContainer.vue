<script setup lang="ts">
import { toast } from "@denser/design-system";
import DocumentHeader from "../presentationals/DocumentHeader.vue";
import type { DocumentHeaderView } from "../types";

defineProps<{
  header: DocumentHeaderView;
}>();

function onMove() {
  toast("Move — coming soon");
}

function onShare() {
  toast("Share — coming soon");
}
</script>

<template>
  <DocumentHeader :header="header" @move="onMove" @share="onShare" />
</template>
