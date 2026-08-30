import { expect, test } from "vitest"
import { dropRegistration, invertSettleDelta, settleFromRect, settleOrigins } from "./settle"

const slotA = { x: 0, y: 0, width: 80, height: 40 }
const slotB = { x: 100, y: 0, width: 80, height: 40 }

test("settleFromRect prefers the overlay, then the pre-commit box", () => {
  expect(settleFromRect(slotB, slotA, slotA)).toEqual(slotB)
  expect(settleFromRect(undefined, slotA, slotB)).toEqual(slotA)
  expect(settleFromRect(undefined, undefined, slotB)).toEqual(slotB)
})

test("swap settle invert is near zero when the overlay is already over the new slot", () => {
  const delta = invertSettleDelta(slotB, slotB)
  expect(delta).toEqual({ x: 0, y: 0 })
})

test("swap settle invert to the old slot is the opposite jump we used to show", () => {
  expect(invertSettleDelta(slotB, slotA)).toEqual({ x: 100, y: 0 })
})

test("dragged item FLIPs from the overlay; partner FLIPs from its pre-commit box", () => {
  const origins = settleOrigins(
    ["weather", "notes"],
    new Map([["weather", slotB]]),
    new Map([
      ["weather", slotA],
      ["notes", slotB],
    ]),
    new Map([
      ["weather", slotB],
      ["notes", slotA],
    ]),
  )
  expect(origins.get("weather")).toEqual({ x: 0, y: 0 })
  expect(origins.get("notes")).toEqual({ x: 100, y: 0 })
})

test("unregistering an old element does not drop a newer registration for the same id", () => {
  const oldEl = { id: "old" }
  const newEl = { id: "new" }
  const registry = new Map([["weather", { element: newEl }]])
  dropRegistration(registry, "weather", { element: oldEl })
  expect(registry.get("weather")?.element).toBe(newEl)
  dropRegistration(registry, "weather", { element: newEl })
  expect(registry.has("weather")).toBe(false)
})
