<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { ComponentPublicInstance, HTMLAttributes } from "vue"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { useDndSession } from "./useDndSession"
import { hostElement } from "./host"
import type { DndId } from "./types"

const props = withDefaults(defineProps<PrimitiveProps & {
  slotId: DndId
  occupantId?: DndId | null
  class?: HTMLAttributes["class"]
}>(), {
  as: "div",
})

const session = useDndSession()
const el = ref<ComponentPublicInstance | HTMLElement>()
let stop: (() => void) | undefined

onMounted(async () => {
  await nextTick()
  const element = hostElement(el)
  if (!element)
    return
  stop = session.registerSlot(props.slotId, {
    element,
    occupantId: props.occupantId ?? null,
  })
})

onUnmounted(() => {
  stop?.()
})

watch(() => props.occupantId, (occupantId) => {
  session.updateSlot(props.slotId, { occupantId: occupantId ?? null })
})

const isOver = computed(() => session.isOverSlot(props.slotId))
</script>

<template>
  <Primitive
    ref="el"
    :data-testid="`dnd-slot-${slotId}`"
    data-slot="dnd-slot"
    :data-over="isOver || undefined"
    :as="as"
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot :is-over="isOver" :occupant-id="occupantId ?? null" />
  </Primitive>
</template>
