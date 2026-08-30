import { expect, test } from "vitest"
import { commitSwapMap, computeSwapTransforms, hitTestSwap, previewSwapMap } from "./swap"

const slots = [
  { id: "a", occupantId: "one", x: 0, y: 0, width: 40, height: 40 },
  { id: "b", occupantId: "two", x: 50, y: 0, width: 40, height: 40 },
]

const map = { a: "one", b: "two" }

test("hitTestSwap uses untransformed slot boxes", () => {
  expect(hitTestSwap(slots, { x: 55, y: 10 })).toEqual({ slotId: "b" })
  expect(hitTestSwap(slots, { x: 200, y: 10 })).toBeNull()
})

test("drop mode does not preview-exchange occupancy", () => {
  expect(previewSwapMap(map, "a", "b", "drop")).toEqual(map)
})

test("hover mode exchanges occupancy while dragging", () => {
  expect(previewSwapMap(map, "a", "b", "hover")).toEqual({ a: "two", b: "one" })
})

test("commitSwapMap exchanges two slots and allows an empty target", () => {
  expect(commitSwapMap(map, "a", "b")).toEqual({ a: "two", b: "one" })
  expect(commitSwapMap({ a: "one", b: null }, "a", "b")).toEqual({ a: null, b: "one" })
})

test("hover preview translates the displaced occupant to the source slot", () => {
  const preview = previewSwapMap(map, "a", "b", "hover")
  const transforms = computeSwapTransforms(slots, map, preview)
  expect(transforms.get("two")).toEqual({ x: -50, y: 0 })
})
