<script setup lang="ts">
import type { MenubarItemEmits, MenubarItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { MenubarItem, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  MenubarItemProps & {
    class?: HTMLAttributes["class"];
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>();

const emits = defineEmits<MenubarItemEmits>();

const delegatedProps = reactiveOmit(props, "class", "inset", "variant");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <MenubarItem
    data-slot="menubar-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwarded"
    :class="
      cn(
        'group/menubar-item relative flex min-h-7 cursor-default items-center gap-2 rounded-xl px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!',
        props.class,
      )
    "
  >
    <slot />
  </MenubarItem>
</template>
