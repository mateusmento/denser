<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { CSSProperties, HTMLAttributes } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes["class"];
      style?: CSSProperties;
    }
  >(),
  {
    as: "div",
  },
);
</script>

<template>
  <Primitive
    data-testid="dnd-placeholder"
    data-slot="dnd-placeholder"
    :as="as"
    :as-child="asChild"
    :class="
      cn(
        'pointer-events-none rounded-lg border-2 border-dashed border-primary/30 bg-primary/5',
        props.class,
      )
    "
    :style="props.style"
  />
</template>
