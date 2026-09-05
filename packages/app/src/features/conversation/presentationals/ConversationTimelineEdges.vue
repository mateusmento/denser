<script setup lang="ts">
import {
  MessageScrollerButton,
  useMessageScrollerContextMaybe,
  useMessageScrollerScrollable,
} from "@denser/design-system";
import {
  emptyNextPageState,
  emptyPreviousPageState,
  type NextPageState,
  type PreviousPageState,
} from "@/lib/async";
import { computed, toRef } from "vue";
import { useTimelineEdgeLoads } from "../composables/useTimelineEdgeLoads";
import { distanceFromEnd } from "../lib/scroll-edge-geometry";

const props = withDefaults(
  defineProps<{
    previousPage?: PreviousPageState;
    nextPage?: NextPageState;
    showJumpToLatest?: boolean;
    /** Bust edge arm state when the message window recenters (conversation / focus). */
    edgeResetKey?: unknown;
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
const scroller = useMessageScrollerContextMaybe();

const { nearPx } = useTimelineEdgeLoads({
  previousPage: toRef(props, "previousPage"),
  nextPage: toRef(props, "nextPage"),
  resetKey: toRef(props, "edgeResetKey"),
  onLoadPrevious: () => emit("loadPrevious"),
  onLoadNext: () => emit("loadNext"),
});

const jumpActive = computed(() => {
  if (props.showJumpToLatest || props.nextPage.hasNext) return true;
  const el = scroller?.viewportElement.value;
  if (el) return distanceFromEnd(el) > nearPx;
  return scrollable.value.end;
});

function onJumpToLatest() {
  emit("jumpToLatest");
}
</script>

<template>
  <MessageScrollerButton :active="jumpActive" @action="onJumpToLatest" />
</template>
