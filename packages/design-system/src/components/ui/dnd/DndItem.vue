<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { ComponentPublicInstance, CSSProperties, HTMLAttributes } from "vue"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { useDndSession } from "./useDndSession"
import { hostElement } from "./host"
import type { DndId } from "./types"

const props = withDefaults(defineProps<PrimitiveProps & {
  itemId: DndId
  listId?: DndId
  slotId?: DndId
  index?: number
  sourceIds?: DndId[]
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>(), {
  as: "div",
})

const session = useDndSession()
const el = ref<ComponentPublicInstance | HTMLElement>()
let stopRegister: (() => void) | undefined
let stopSensor: (() => void) | undefined

function host() {
  return hostElement(el)
}

function registration() {
  return {
    element: host()!,
    listId: props.listId,
    slotId: props.slotId,
    index: props.index ?? 0,
  }
}

function detach() {
  stopSensor?.()
  stopRegister?.()
  stopSensor = undefined
  stopRegister = undefined
}

function attach() {
  detach()
  const element = host()
  if (!element)
    return
  stopRegister = session.registerItem(props.itemId, registration())
  if (!props.disabled) {
    stopSensor = session.bindActivator(element, props.itemId, () => {
      if (props.sourceIds?.includes(props.itemId))
        return props.sourceIds
      return session.sourceIdsFor(props.itemId)
    })
  }
}

onMounted(async () => {
  await nextTick()
  attach()
})

onUnmounted(() => {
  detach()
})

watch(
  () => [props.itemId, props.listId, props.slotId, props.index, props.disabled] as const,
  () => {
    if (host())
      attach()
  },
)

const isDragging = computed(() => session.isSource(props.itemId))
const hidden = computed(() => session.hideSource(props.itemId))
const itemStyle = computed((): CSSProperties => {
  const delta = session.itemTransform(props.itemId)
  const settling = session.phase.value === "settling"
  return {
    transform: delta.x === 0 && delta.y === 0 ? undefined : `translate(${delta.x}px, ${delta.y}px)`,
    transition: session.active.value && !settling && !isDragging.value
      ? "transform 180ms ease"
      : undefined,
    visibility: hidden.value ? "hidden" : undefined,
    zIndex: isDragging.value && !session.hasOverlay.value ? "10" : undefined,
  }
})
</script>

<template>
  <Primitive
    ref="el"
    :data-testid="`dnd-item-${itemId}`"
    data-slot="dnd-item"
    :data-dragging="isDragging || undefined"
    :as="as"
    :as-child="asChild"
    :class="cn('touch-none select-none', props.class)"
    :style="itemStyle"
    @dragstart.prevent
  >
    <slot :is-dragging="isDragging" />
  </Primitive>
</template>
