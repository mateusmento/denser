<script setup lang="ts">
import type { ContextMenuContentEmits, ContextMenuContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { ContextMenuContent, ContextMenuPortal, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<ContextMenuContentProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<ContextMenuContentEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ContextMenuPortal>
    <ContextMenuContent
      data-slot="context-menu-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-popover/45 text-popover-foreground ring-1 ring-foreground/5 backdrop-blur-sm duration-100 dark:ring-foreground/10 dark:backdrop-blur-lg',
          'cn-menu-translucent z-50 min-w-36 overflow-x-hidden overflow-y-auto rounded-xl p-1 shadow-lg',
          'max-h-(--reka-context-menu-content-available-height) origin-(--reka-context-menu-content-transform-origin)',
          'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class,
        )
      "
    >
      <slot />
    </ContextMenuContent>
  </ContextMenuPortal>
</template>
