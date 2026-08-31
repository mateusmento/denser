import type { DndPoint, DndRect } from "./types"

export function distance(a: DndPoint, b: DndPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function pointInRect(point: DndPoint, rect: DndRect): boolean {
  return (
    point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
  )
}

export function translateRect(rect: DndRect, delta: DndPoint): DndRect {
  return {
    x: rect.x + delta.x,
    y: rect.y + delta.y,
    width: rect.width,
    height: rect.height,
  }
}

export function parseTranslate(transform: string): DndPoint {
  if (!transform || transform === "none")
    return { x: 0, y: 0 }

  const matrix3d = /^matrix3d\((.+)\)$/.exec(transform)
  if (matrix3d?.[1]) {
    const parts = matrix3d[1].split(",").map(Number)
    return { x: parts[12] ?? 0, y: parts[13] ?? 0 }
  }

  const matrix = /^matrix\((.+)\)$/.exec(transform)
  if (matrix?.[1]) {
    const parts = matrix[1].split(",").map(Number)
    return { x: parts[4] ?? 0, y: parts[5] ?? 0 }
  }

  return { x: 0, y: 0 }
}

export function subtractTranslate(rect: DndRect, transform: string): DndRect {
  const { x, y } = parseTranslate(transform)
  return {
    x: rect.x - x,
    y: rect.y - y,
    width: rect.width,
    height: rect.height,
  }
}

export function getUntransformedRect(element: HTMLElement): DndRect {
  const rect = element.getBoundingClientRect()
  return subtractTranslate(
    { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    getComputedStyle(element).transform,
  )
}

export function applyScrollDelta(rect: DndRect, start: DndPoint, current: DndPoint): DndRect {
  return {
    x: rect.x - (current.x - start.x),
    y: rect.y - (current.y - start.y),
    width: rect.width,
    height: rect.height,
  }
}

export function parseCssGap(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function readCssGap(
  element: HTMLElement,
  orientation: "horizontal" | "vertical",
): number {
  const style = getComputedStyle(element)
  return parseCssGap(orientation === "vertical" ? style.rowGap : style.columnGap)
}

export function listGap(
  items: Array<DndRect & { index: number }>,
  orientation: "horizontal" | "vertical",
  fallback = 0,
): number {
  const ordered = [...items].sort((a, b) => a.index - b.index)
  const first = ordered[0]
  const second = ordered[1]
  if (!first || !second)
    return fallback
  return orientation === "vertical"
    ? second.y - (first.y + first.height)
    : second.x - (first.x + first.width)
}
