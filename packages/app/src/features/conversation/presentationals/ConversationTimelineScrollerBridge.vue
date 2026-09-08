<script setup lang="ts">
import { useMessageScroller } from "@denser/design-system";

const { scrollToEnd, scrollToMessage } = useMessageScroller();

defineExpose({ scrollToEnd, scrollToMessage });
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
