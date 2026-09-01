<script setup lang="ts">
import type { MenubarCheckboxItemEmits, MenubarCheckboxItemProps } from "reka-ui";

import type { HTMLAttributes } from "vue";
import { CheckIcon } from "@lucide/vue";
import { reactiveOmit } from "@vueuse/core";
import { MenubarCheckboxItem, MenubarItemIndicator, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<MenubarCheckboxItemProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<MenubarCheckboxItemEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <MenubarCheckboxItem
    data-slot="menubar-checkbox-item"
    v-bind="forwarded"
    :class="
      cn(
        'relative mx-1 flex min-h-7 cursor-default items-center gap-2 rounded-xl py-1.5 pr-1.5 pl-7 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
        props.class,
      )
    "
  >
    <span
      class="pointer-events-none absolute left-1.5 flex size-4 items-center justify-center [&_svg:not([class*=size-])]:size-4"
    >
      <MenubarItemIndicator>
        <slot name="indicator-icon">
          <CheckIcon />
        </slot>
      </MenubarItemIndicator>
    </span>
    <slot />
  </MenubarCheckboxItem>
</template>
