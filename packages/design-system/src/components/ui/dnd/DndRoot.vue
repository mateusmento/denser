<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { ComponentPublicInstance, HTMLAttributes } from "vue";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";
import { useProvideDndSession, type DndSessionConfig } from "./useDndSession";
import { createOverflowScrollPort } from "./scroll-port";
import { hostElement } from "./host";
import type { DndCommitPayload } from "./types";

type Props = DndSessionConfig &
  PrimitiveProps & {
    class?: HTMLAttributes["class"];
  };

const props = withDefaults(defineProps<Props>(), {
  policy: "sort",
  settle: "overlay",
  sourceMode: "hide",
  swapMode: "drop",
  orientation: "vertical",
  as: "div",
});

const emit = defineEmits<{
  commit: [payload: DndCommitPayload];
}>();

const el = ref<ComponentPublicInstance | HTMLElement>();
let stopPort: (() => void) | undefined;

function host() {
  return hostElement(el);
}

const session = useProvideDndSession(
  computed(() => ({
    policy: props.policy,
    settle: props.settle,
    sourceMode: props.sourceMode,
    swapMode: props.swapMode,
    orientation: props.orientation,
    sensors: props.sensors,
    sourceIdsFor: props.sourceIdsFor,
    onCommit: (payload) => {
      emit("commit", payload);
    },
  })),
);

function findScrollContainer(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const viewport = parent.closest?.('[data-slot="scroll-area-viewport"]');
    if (viewport instanceof HTMLElement) return viewport;
    const overflow = getComputedStyle(parent);
    if (
      overflow.overflowY === "auto" ||
      overflow.overflowY === "scroll" ||
      overflow.overflowX === "auto" ||
      overflow.overflowX === "scroll"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

onMounted(async () => {
  await nextTick();
  const element = host();
  if (!element) return;
  const scrollContainer = findScrollContainer(element);
  if (scrollContainer) {
    stopPort = session.registerScrollPort("__root__", createOverflowScrollPort(scrollContainer));
  }
});

onUnmounted(() => {
  stopPort?.();
});
</script>

<template>
  <Primitive
    ref="el"
    data-slot="dnd-root"
    :data-dnd-phase="session.phase.value"
    :data-dnd-policy="props.policy"
    :as="as"
    :as-child="asChild"
    :class="cn('relative', props.class)"
  >
    <slot />
  </Primitive>
</template>
