<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { ComponentPublicInstance, HTMLAttributes } from "vue"
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { createOverflowScrollPort } from "./scroll-port"
import { useDndSession } from "./useDndSession"
import { hostElement } from "./host"
import type { DndAxis, DndId } from "./types"
import DndPlaceholder from "./DndPlaceholder.vue"

const props = withDefaults(defineProps<PrimitiveProps & {
  listId: DndId
  orientation?: DndAxis
  placeholderAs?: PrimitiveProps["as"]
  class?: HTMLAttributes["class"]
}>(), {
  orientation: undefined,
  as: "div",
})

const session = useDndSession()
const el = ref<ComponentPublicInstance | HTMLElement>()
let stop: (() => void) | undefined
let stopPort: (() => void) | undefined

function host() {
  return hostElement(el)
}

onMounted(async () => {
  await nextTick()
  const element = host()
  if (!element)
    return
  stop = session.registerList(props.listId, {
    element,
    orientation: props.orientation ?? "vertical",
  })
  const overflow = getComputedStyle(element)
  if (overflow.overflowY === "auto" || overflow.overflowY === "scroll" || overflow.overflowX === "auto" || overflow.overflowX === "scroll")
    stopPort = session.registerScrollPort(props.listId, createOverflowScrollPort(element))
})

onUnmounted(() => {
  stop?.()
  stopPort?.()
})

const placeholderStyle = computed(() => {
  const view = session.placeholder.value
  const element = host()
  if (!view || view.listId !== props.listId || !element)
    return { display: "none" as const }
  const box = element.getBoundingClientRect()
  return {
    position: "absolute" as const,
    left: `${view.rect.x - box.left}px`,
    top: `${view.rect.y - box.top}px`,
    width: `${view.rect.width}px`,
    height: `${view.rect.height}px`,
  }
})

const showPlaceholder = computed(() => {
  const view = session.placeholder.value
  return view?.listId === props.listId && session.phase.value !== "idle"
})

const resolvedPlaceholderAs = computed(() => {
  if (props.placeholderAs)
    return props.placeholderAs
  const tag = host()?.tagName
  if (tag === "UL" || tag === "OL" || props.as === "ul" || props.as === "ol")
    return "li"
  return "div"
})
</script>

<template>
  <Primitive
    ref="el"
    :data-testid="`dnd-list-${listId}`"
    data-slot="dnd-list"
    :as="as"
    :as-child="asChild"
    :class="cn('relative', props.class)"
  >
    <slot />
  </Primitive>
  <Teleport v-if="showPlaceholder && host()" :to="host()">
    <DndPlaceholder :as="resolvedPlaceholderAs" :style="placeholderStyle" />
  </Teleport>
</template>
