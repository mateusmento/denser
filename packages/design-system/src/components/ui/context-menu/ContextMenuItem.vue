<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { ContextMenuItem, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<
    ContextMenuItemProps & {
      class?: HTMLAttributes["class"];
      inset?: boolean;
      variant?: "default" | "destructive";
    }
  >(),
  {
    variant: "default",
  },
);
const emits = defineEmits<ContextMenuItemEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwarded"
    :class="
      cn(
        'group/context-menu-item data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/20',
        'data-[variant=destructive]:data-highlighted:text-destructive dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-highlighted:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive',
        'relative mx-1 flex min-h-7 cursor-default gap-2 rounded-lg px-2 py-1 text-xs data-inset:pl-7 [&_svg:not([class*=size-])]:size-3',
        'items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>
