<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { ComponentPublicInstance, HTMLAttributes } from "vue"
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { useDndSession } from "./useDndSession"
import { hostElement } from "./host"
import type { DndId } from "./types"

const props = withDefaults(defineProps<PrimitiveProps & {
  targetId: DndId
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
  stop = session.registerTarget(props.targetId, { element })
})

onUnmounted(() => {
  stop?.()
})

const isOver = computed(() => session.isOverTarget(props.targetId))
</script>

<template>
  <Primitive
    ref="el"
    :data-testid="`dnd-target-${targetId}`"
    data-slot="dnd-target"
    :data-over="isOver || undefined"
    :as="as"
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot :is-over="isOver" />
  </Primitive>
</template>
