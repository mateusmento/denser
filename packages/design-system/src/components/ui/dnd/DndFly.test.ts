import { expect, test } from "vitest"
import { easeOutCubic, flockOverlayRects, interpolateRect } from "./DndFly"

test("easeOutCubic starts and ends on the unit interval", () => {
  expect(easeOutCubic(0)).toBe(0)
  expect(easeOutCubic(1)).toBe(1)
  expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
})

test("interpolateRect eases from the source rect to the target", () => {
  const from = { x: 0, y: 0, width: 10, height: 10 }
  const to = { x: 100, y: 50, width: 20, height: 10 }
  expect(interpolateRect(from, to, 0)).toEqual(from)
  expect(interpolateRect(from, to, 1)).toEqual(to)
  const mid = interpolateRect(from, to, 0.5)
  expect(mid.x).toBeGreaterThan(50)
  expect(mid.y).toBeGreaterThan(25)
})

test("flockOverlayRects gathers every start rect toward the pointer", () => {
  const starts = new Map([
    ["a", { x: 0, y: 0, width: 10, height: 10 }],
    ["b", { x: 80, y: 0, width: 10, height: 10 }],
  ])
  const target = { x: 40, y: 20, width: 10, height: 10 }
  const start = flockOverlayRects(starts, target, 0)
  expect(start.get("a")).toEqual(starts.get("a"))
  expect(start.get("b")).toEqual(starts.get("b"))
  const end = flockOverlayRects(starts, target, 1)
  expect(end.get("a")).toEqual({ x: 40, y: 20, width: 10, height: 10 })
  expect(end.get("b")).toEqual({ x: 40, y: 20, width: 10, height: 10 })

  const mid = flockOverlayRects(starts, target, 0.5)
  const gap = Math.abs((mid.get("b")?.x ?? 0) - (mid.get("a")?.x ?? 0))
  expect(gap).toBeLessThan(80)
})
