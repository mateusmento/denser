<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ScrollAreaRootProps } from 'reka-ui'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from '@/components/ui/scroll-area/ScrollBar.vue'
import { SCROLL_KEYS, useMessageScrollerContext } from './useMessageScroller'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  preserveScrollOnPrepend?: boolean
  /** Reka ScrollArea visibility: hover | scroll | auto | always | glimpse */
  type?: ScrollAreaRootProps['type']
}>(), {
  preserveScrollOnPrepend: true,
  type: 'hover',
})

const {
  autoscrolling,
  handleResize,
  scrollableAttr,
  setPreserveScrollOnPrepend,
  setViewportElement,
  syncAfterScroll,
  userScrollIntent,
} = useMessageScrollerContext()

const viewportComp = useTemplateRef<{ viewportElement?: HTMLElement }>('viewport')

watch(() => props.preserveScrollOnPrepend, setPreserveScrollOnPrepend, { immediate: true })

function onKeyDown(event: KeyboardEvent) {
  if (SCROLL_KEYS.has(event.key))
    userScrollIntent()
}

function resolveViewportElement(): HTMLElement | null {
  const exposed = viewportComp.value?.viewportElement
  return exposed instanceof HTMLElement ? exposed : null
}

let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0

onMounted(() => {
  const viewport = resolveViewportElement()
  setViewportElement(viewport)
  if (!viewport || typeof ResizeObserver === 'undefined')
    return
  resizeObserver = new ResizeObserver(() => {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(handleResize)
  })
  resizeObserver.observe(viewport)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  resizeObserver = null
  setViewportElement(null)
})
</script>

<template>
  <ScrollAreaRoot
    data-slot="message-scroller-viewport"
    :type="type"
    :data-scrollable="scrollableAttr"
    :data-autoscrolling="autoscrolling ? '' : undefined"
    :class="cn(
      'relative size-full min-h-0 min-w-0 overscroll-contain',
      'data-autoscrolling:**:data-[slot=scroll-area-scrollbar]:opacity-0',
      props.class,
    )"
  >
    <ScrollAreaViewport
      ref="viewport"
      data-slot="message-scroller-viewport-scroll"
      role="region"
      aria-label="Messages"
      class="size-full min-h-0 outline-none"
      @scroll="syncAfterScroll()"
      @wheel="userScrollIntent()"
      @touchmove="userScrollIntent()"
      @keydown="onKeyDown"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
