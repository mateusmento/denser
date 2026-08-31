import { distance } from "../geometry"
import type { DndPoint, DndSensor, DndSensorEvent } from "../types"

export type PointerSensorOptions = {
  threshold?: number
}

function isIgnoredTarget(event: PointerEvent, element: HTMLElement) {
  const target = event.target
  if (!(target instanceof Element))
    return false
  const ignore = target.closest("[data-dnd-ignore]")
  return ignore != null && ignore !== element && element.contains(ignore)
}

function suppressNextClick() {
  const stop = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    document.removeEventListener("click", stop, true)
  }
  document.addEventListener("click", stop, true)
  window.setTimeout(() => {
    document.removeEventListener("click", stop, true)
  }, 0)
}

export function createPointerSensor(options: PointerSensorOptions = {}): DndSensor {
  const threshold = options.threshold ?? 5

  return {
    bind(element, emit) {
      let pointerId: number | null = null
      let origin: DndPoint | null = null
      let started = false

      const detachDocument = () => {
        document.removeEventListener("pointermove", onMove, true)
        document.removeEventListener("pointerup", onUp, true)
        document.removeEventListener("pointercancel", onCancel, true)
      }

      const reset = () => {
        pointerId = null
        origin = null
        started = false
        detachDocument()
      }

      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId || !origin)
          return
        const point = { x: event.clientX, y: event.clientY }
        if (!started) {
          if (distance(point, origin) < threshold)
            return
          started = true
          if (element.hasPointerCapture?.(event.pointerId) !== true)
            element.setPointerCapture(event.pointerId)
          emit({ type: "start", point, pointerId: event.pointerId, event })
        }
        emit({ type: "move", point, pointerId: event.pointerId, event })
      }

      const onUp = (event: PointerEvent) => {
        if (event.pointerId !== pointerId)
          return
        if (started) {
          emit({
            type: "end",
            point: { x: event.clientX, y: event.clientY },
            pointerId: event.pointerId,
            event,
          })
          suppressNextClick()
          if (element.hasPointerCapture?.(event.pointerId))
            element.releasePointerCapture(event.pointerId)
        }
        reset()
      }

      const onCancel = (event: PointerEvent) => {
        if (event.pointerId !== pointerId)
          return
        if (started)
          emit({ type: "cancel" } satisfies DndSensorEvent)
        if (element.hasPointerCapture?.(event.pointerId))
          element.releasePointerCapture(event.pointerId)
        reset()
      }

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0 || isIgnoredTarget(event, element))
          return
        pointerId = event.pointerId
        origin = { x: event.clientX, y: event.clientY }
        started = false
        document.addEventListener("pointermove", onMove, true)
        document.addEventListener("pointerup", onUp, true)
        document.addEventListener("pointercancel", onCancel, true)
      }

      element.addEventListener("pointerdown", onDown)

      return () => {
        element.removeEventListener("pointerdown", onDown)
        reset()
      }
    },
  }
}
