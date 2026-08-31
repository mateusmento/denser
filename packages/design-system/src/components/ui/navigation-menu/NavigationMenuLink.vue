<script setup lang="ts">
import type { NavigationMenuLinkEmits, NavigationMenuLinkProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { NavigationMenuLink, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<NavigationMenuLinkProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<NavigationMenuLinkEmits>();

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NavigationMenuLink
    data-slot="navigation-menu-link"
    v-bind="forwarded"
    :class="
      cn(
        'flex items-center gap-2 rounded-2xl px-2.5 py-1.5 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 in-data-[slot=navigation-menu-content]:w-full in-data-[slot=navigation-menu-content]:rounded-xl in-data-[slot=navigation-menu-content]:p-2 in-data-[slot=navigation-menu-content]:font-normal data-[active=true]:bg-muted/50 data-[active=true]:hover:bg-muted data-[active=true]:focus:bg-muted [&_svg:not([class*=size-])]:size-4',
        props.class,
      )
    "
  >
    <slot />
  </NavigationMenuLink>
</template>
