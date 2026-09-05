<script setup lang="ts">
import { MessageScrollerButton, useMessageScrollerScrollable } from "@denser/design-system";
import { useDebounceFn } from "@vueuse/core";
import { computed, watch } from "vue";

const props = withDefaults(
  defineProps<{
    hasMoreOlder?: boolean;
    hasMoreNewer?: boolean;
    showJumpToLatest?: boolean;
    loadingOlder?: boolean;
  }>(),
  {
    hasMoreOlder: false,
    hasMoreNewer: false,
    showJumpToLatest: false,
    loadingOlder: false,
  },
);

const emit = defineEmits<{
  loadOlder: [];
  jumpToLatest: [];
}>();

const scrollable = useMessageScrollerScrollable();

const jumpActive = computed(
  () => props.showJumpToLatest || props.hasMoreNewer || scrollable.value.end,
);

const scheduleLoadOlder = useDebounceFn(() => {
  if (props.hasMoreOlder && !props.loadingOlder) emit("loadOlder");
}, 120);

watch(
  () => scrollable.value.start,
  (nearTop) => {
    if (nearTop) scheduleLoadOlder();
  },
);

function onJumpToLatest() {
  emit("jumpToLatest");
}
</script>

<template>
  <MessageScrollerButton :active="jumpActive" @action="onJumpToLatest" />
</template>
