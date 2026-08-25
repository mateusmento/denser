<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** Merged onto the sticky pill (e.g. surface fill: `bg-background`, `bg-card/90`). */
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!--
    Root wraps label + body so sticky has a tall containing block.
    Rule is absolute at the top (scrolls away); only the chip sticks.
  -->
  <section data-slot="sticky-marker" class="relative flex flex-col gap-1.5">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-8 items-center"
      aria-hidden="true"
    >
      <Separator class="w-full" />
    </div>
    <div class="sticky top-0 z-10 flex justify-center py-1">
      <div
        :class="cn(
          'relative w-fit border border-border rounded-full px-3 py-1 whitespace-nowrap',
          'hover:bg-muted text-center text-xs text-muted-foreground cursor-pointer',
          props.class,
        )"
      >
        <slot name="label" />
      </div>
    </div>
    <slot />
  </section>
</template>
