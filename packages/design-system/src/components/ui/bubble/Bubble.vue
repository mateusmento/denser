<script lang="ts" setup>
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import type { BubbleVariant } from ".";
import { Primitive } from "reka-ui";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { bubbleVariants, provideBubbleContext } from ".";

interface Props extends PrimitiveProps {
  variant?: BubbleVariant;
  align?: "start" | "end";
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  align: "start",
  as: "div",
});

provideBubbleContext({
  variant: computed(() => props.variant),
});
</script>

<template>
  <Primitive
    data-slot="bubble"
    :data-variant="variant"
    :data-align="align"
    :as="as"
    :as-child="asChild"
    :class="cn(bubbleVariants(), props.class)"
  >
    <slot />
  </Primitive>
</template>
