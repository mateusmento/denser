<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
}>(), {
  size: 'default',
})
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :class="cn('bg-card text-card-foreground border border-transparent gap-(--card-spacing) rounded-[min(var(--radius-4xl),24px)] py-(--card-spacing) text-sm [--card-spacing:--spacing(5)] has-[>img:first-child]:overflow-hidden has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-[min(var(--radius-4xl),24px)] *:[img:last-child]:rounded-b-[min(var(--radius-4xl),24px)] group/card flex flex-col', props.class)"
  >
    <slot />
  </div>
</template>
