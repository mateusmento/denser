<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { computed, onMounted, onUnmounted } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";
import { useDndSession } from "./useDndSession";
import type { DndId } from "./types";

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes["class"];
    }
  >(),
  {
    as: "div",
  },
);

const session = useDndSession();
let stop: (() => void) | undefined;

onMounted(() => {
  stop = session.registerOverlay();
});

onUnmounted(() => {
  stop?.();
});

const ids = computed(() => {
  if (session.phase.value === "idle") return [];
  if (session.phase.value === "settling" && session.settle.value === "item") return [];
  return session.visibleSourceIds.value;
});

const styles = computed(() => {
  void session.overlayRects.value;
  return Object.fromEntries(ids.value.map((id) => [id, session.overlayStyle(id)]));
});
</script>

<template>
  <Teleport to="body">
    <Primitive
      v-for="(sourceId, index) in ids"
      :key="sourceId"
      :data-testid="index === 0 ? 'dnd-overlay' : `dnd-overlay-${sourceId}`"
      data-slot="dnd-overlay"
      :data-source-id="sourceId"
      :data-overlay-index="index"
      :as="as"
      :as-child="asChild"
      :class="cn(props.class)"
      :style="styles[sourceId]"
    >
      <slot :source-id="sourceId as DndId" :index="index" />
    </Primitive>
  </Teleport>
</template>
