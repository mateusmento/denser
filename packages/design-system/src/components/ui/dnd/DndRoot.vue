<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";
import { useProvideDndSession, type DndSessionConfig } from "./useDndSession";
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
</script>

<template>
  <Primitive
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
