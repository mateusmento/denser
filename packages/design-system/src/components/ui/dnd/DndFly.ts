import type { DndId, DndRect } from "./types"

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function flockOverlayRects(
  starts: Map<DndId, DndRect>,
  target: DndRect,
  t: number,
): Map<DndId, DndRect> {
  const next = new Map<DndId, DndRect>()
  for (const [id, start] of starts) {
    next.set(id, interpolateRect(start, {
      x: target.x,
      y: target.y,
      width: start.width,
      height: start.height,
    }, t))
  }
  return next
}

export function interpolateRect(from: DndRect, to: DndRect, t: number): DndRect {
  const eased = easeOutCubic(Math.min(1, Math.max(0, t)))
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    width: from.width + (to.width - from.width) * eased,
    height: from.height + (to.height - from.height) * eased,
  }
}

export type DndFlyHandle = {
  stop: () => void
  finished: Promise<void>
}

export type DndFlyOptions = {
  from: DndRect
  to: DndRect | (() => DndRect)
  duration?: number
  onUpdate?: (rect: DndRect, t: number) => void
  onFinish: () => void
}

function resolveTo(to: DndRect | (() => DndRect)): DndRect {
  return typeof to === "function" ? to() : to
}

export function dndFly(options: DndFlyOptions): DndFlyHandle {
  const duration = options.duration ?? 220
  const apply = (rect: DndRect, t: number) => {
    options.onUpdate?.(rect, t)
  }

  if (duration <= 0) {
    apply(resolveTo(options.to), 1)
    options.onFinish()
    return { stop() {}, finished: Promise.resolve() }
  }

  let raf = 0
  let stopped = false
  let resolveFinished!: () => void
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })
  const startedAt = performance.now()

  const tick = (now: number) => {
    if (stopped)
      return
    const t = Math.min(1, (now - startedAt) / duration)
    apply(interpolateRect(options.from, resolveTo(options.to), t), t)
    if (t < 1) {
      raf = requestAnimationFrame(tick)
      return
    }
    options.onFinish()
    resolveFinished()
  }

  raf = requestAnimationFrame(tick)

  return {
    stop() {
      stopped = true
      cancelAnimationFrame(raf)
    },
    finished,
  }
}
