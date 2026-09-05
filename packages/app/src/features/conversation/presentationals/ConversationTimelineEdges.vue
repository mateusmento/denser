<script setup lang="ts">
import { MessageScrollerButton, useMessageScrollerScrollable } from "@denser/design-system";
import { emptyNextPageState, emptyPreviousPageState, type NextPageState, type PreviousPageState } from "@/lib/async";
import { useDebounceFn } from "@vueuse/core";
import { computed, watch } from "vue";

const props = withDefaults(
  defineProps<{
    previousPage?: PreviousPageState;
    nextPage?: NextPageState;
    showJumpToLatest?: boolean;
  }>(),
  {
    previousPage: () => emptyPreviousPageState(),
    nextPage: () => emptyNextPageState(),
    showJumpToLatest: false,
  },
);

const emit = defineEmits<{
  loadPrevious: [];
  loadNext: [];
  jumpToLatest: [];
}>();

const scrollable = useMessageScrollerScrollable();

const jumpActive = computed(
  () => props.showJumpToLatest || props.nextPage.hasNext || scrollable.value.end,
);

const scheduleLoadPrevious = useDebounceFn(() => {
  if (props.previousPage.hasPrevious && !props.previousPage.loadingPrevious) {
    emit("loadPrevious");
  }
}, 120);

const scheduleLoadNext = useDebounceFn(() => {
  if (props.nextPage.hasNext && !props.nextPage.loadingNext) {
    emit("loadNext");
  }
}, 120);

watch(
  () => scrollable.value.start,
  (nearTop) => {
    if (nearTop) scheduleLoadPrevious();
  },
);

watch(
  () => scrollable.value.end,
  (nearBottom) => {
    if (nearBottom) scheduleLoadNext();
  },
);

function onJumpToLatest() {
  emit("jumpToLatest");
}
</script>

<template>
  <MessageScrollerButton :active="jumpActive" @action="onJumpToLatest" />
</template>
