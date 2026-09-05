<script setup lang="ts">
import { useMessageScroller } from "@denser/design-system";

const { scrollToMessage } = useMessageScroller();

defineExpose({ scrollToMessage });
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
