<script lang="ts" setup>
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { Primitive } from "reka-ui";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { bubbleContentVariants, injectBubbleContext } from ".";

defineOptions({ inheritAttrs: false });

interface Props extends PrimitiveProps {
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  as: "div",
});

const { variant } = injectBubbleContext();

const contentClass = computed(() =>
  cn(bubbleContentVariants({ variant: variant.value }), props.class),
);
</script>

<template>
  <Primitive
    v-bind="$attrs"
    data-slot="bubble-content"
    :as="as"
    :as-child="asChild"
    :class="contentClass"
  >
    <slot />
  </Primitive>
</template>
