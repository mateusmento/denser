import { distance } from "../geometry"
import type { DndPoint, DndSensor, DndSensorEvent } from "../types"

export type PointerSensorOptions = {
  threshold?: number
}

export function createPointerSensor(options: PointerSensorOptions = {}): DndSensor {
  const threshold = options.threshold ?? 5

  return {
    bind(element, emit) {
      let pointerId: number | null = null
      let origin: DndPoint | null = null
      let started = false

      const reset = () => {
        pointerId = null
        origin = null
        started = false
      }

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0)
          return
        pointerId = event.pointerId
        origin = { x: event.clientX, y: event.clientY }
        started = false
        element.setPointerCapture(event.pointerId)
      }

      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId || !origin)
          return
        const point = { x: event.clientX, y: event.clientY }
        if (!started) {
          if (distance(point, origin) < threshold)
            return
          started = true
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
        }
        reset()
      }

      const onCancel = (event: PointerEvent) => {
        if (event.pointerId !== pointerId)
          return
        if (started)
          emit({ type: "cancel" } satisfies DndSensorEvent)
        reset()
      }

      element.addEventListener("pointerdown", onDown)
      element.addEventListener("pointermove", onMove)
      element.addEventListener("pointerup", onUp)
      element.addEventListener("pointercancel", onCancel)

      return () => {
        element.removeEventListener("pointerdown", onDown)
        element.removeEventListener("pointermove", onMove)
        element.removeEventListener("pointerup", onUp)
        element.removeEventListener("pointercancel", onCancel)
        reset()
      }
    },
  }
}
