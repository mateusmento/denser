import { expect, test } from "vitest"
import {
  applyScrollDelta,
  distance,
  listGap,
  parseCssGap,
  parseTranslate,
  pointInRect,
  subtractTranslate,
  translateRect,
} from "./geometry"

test("distance is the hypotenuse", () => {
  expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
})

test("pointInRect includes edges", () => {
  const rect = { x: 10, y: 20, width: 40, height: 10 }
  expect(pointInRect({ x: 10, y: 20 }, rect)).toBe(true)
  expect(pointInRect({ x: 50, y: 30 }, rect)).toBe(true)
  expect(pointInRect({ x: 9, y: 25 }, rect)).toBe(false)
})

test("parseTranslate reads matrix translation", () => {
  expect(parseTranslate("none")).toEqual({ x: 0, y: 0 })
  expect(parseTranslate("matrix(1, 0, 0, 1, 12, -8)")).toEqual({ x: 12, y: -8 })
  expect(
    parseTranslate("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 6, 0, 1)"),
  ).toEqual({ x: 4, y: 6 })
})

test("subtractTranslate peels a live transform off a viewport rect", () => {
  expect(
    subtractTranslate({ x: 40, y: 80, width: 20, height: 10 }, "matrix(1, 0, 0, 1, 10, 20)"),
  ).toEqual({ x: 30, y: 60, width: 20, height: 10 })
})

test("applyScrollDelta moves snapshots opposite the scroll", () => {
  const rect = { x: 100, y: 200, width: 50, height: 20 }
  expect(
    applyScrollDelta(rect, { x: 0, y: 0 }, { x: 0, y: 40 }),
  ).toEqual({ x: 100, y: 160, width: 50, height: 20 })
})

test("translateRect offsets origin only", () => {
  expect(
    translateRect({ x: 1, y: 2, width: 3, height: 4 }, { x: 10, y: -1 }),
  ).toEqual({ x: 11, y: 1, width: 3, height: 4 })
})

test("listGap reads the space between the first two items", () => {
  expect(
    listGap(
      [
        { x: 0, y: 0, width: 10, height: 20, index: 0 },
        { x: 0, y: 28, width: 10, height: 20, index: 1 },
      ],
      "vertical",
    ),
  ).toBe(8)
})

test("listGap falls back when a list has fewer than two items", () => {
  expect(listGap([{ x: 0, y: 0, width: 10, height: 20, index: 0 }], "vertical", 8)).toBe(8)
  expect(listGap([], "vertical", 8)).toBe(8)
})

test("parseCssGap reads computed pixel gaps", () => {
  expect(parseCssGap("8px")).toBe(8)
  expect(parseCssGap("normal")).toBe(0)
})
