<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ScrollAreaRootProps } from 'reka-ui'
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
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

const rootComp = useTemplateRef<{ $el?: HTMLElement } | HTMLElement>('root')
const viewportComp = useTemplateRef<{ viewportElement?: HTMLElement | { value: HTMLElement | null } }>('viewport')
/** Concrete scroll node — parents / context can depend on this reactively. */
const viewportElement = shallowRef<HTMLElement | null>(null)

watch(() => props.preserveScrollOnPrepend, setPreserveScrollOnPrepend, { immediate: true })

function onKeyDown(event: KeyboardEvent) {
  if (SCROLL_KEYS.has(event.key))
    userScrollIntent()
}

function rootDom(): Element | null {
  const raw = rootComp.value
  if (!raw) return null
  if (raw instanceof Element) return raw
  const el = raw.$el
  return el instanceof Element ? el : null
}

function resolveViewportElement(): HTMLElement | null {
  // Reka exposes `viewportElement` as a Ref; unwrap defensively (proxy auto-unwrap
  // is not always applied when reading from useTemplateRef in script).
  const raw = viewportComp.value?.viewportElement as unknown
  const exposed =
    raw && typeof raw === 'object' && raw !== null && 'value' in raw
      ? (raw as { value: unknown }).value
      : raw
  if (exposed instanceof HTMLElement)
    return exposed

  // Fallback: query the marked scroll node — don't rely on expose quirks alone.
  const node = rootDom()?.querySelector('[data-reka-scroll-area-viewport]')
  return node instanceof HTMLElement ? node : null
}

function bindViewportElement() {
  const el = resolveViewportElement()
  viewportElement.value = el
  setViewportElement(el)
  return el
}

defineExpose({
  viewportElement,
})

let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0

onMounted(async () => {
  bindViewportElement()
  await nextTick()
  const viewport = bindViewportElement()
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
  viewportElement.value = null
  setViewportElement(null)
})
</script>

<template>
  <ScrollAreaRoot
    ref="root"
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
