import { expect, test } from "vitest";
import { autoScrollDelta } from "./scroll-port";
import type { DndScrollPort } from "./types";

function mockPort(viewportRect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): DndScrollPort {
  let offset = { x: 0, y: 0 };
  return {
    get offset() {
      return offset;
    },
    get viewportSize() {
      return { width: viewportRect.width, height: viewportRect.height };
    },
    get viewportRect() {
      return viewportRect;
    },
    scrollBy(delta) {
      offset = { x: offset.x + delta.x, y: offset.y + delta.y };
    },
    subscribe() {
      return () => {};
    },
    dispose() {},
  };
}

test("autoScrollDelta ignores pointers outside the scrollport viewport", () => {
  const port = mockPort({ x: 100, y: 100, width: 200, height: 400 });

  // Pointer to the right of the port (e.g. over a different column)
  expect(autoScrollDelta(port, { x: 350, y: 480 })).toBeNull();

  // Pointer to the left of the port
  expect(autoScrollDelta(port, { x: 50, y: 480 })).toBeNull();

  // Pointer above the port
  expect(autoScrollDelta(port, { x: 150, y: 50 })).toBeNull();

  // Pointer below the port
  expect(autoScrollDelta(port, { x: 150, y: 550 })).toBeNull();
});

test("autoScrollDelta computes velocity when pointer is near inside edge", () => {
  const port = mockPort({ x: 100, y: 100, width: 200, height: 400 });

  // Near top edge inside viewport (y = 120, edge threshold = 40 => 100 + 40 = 140)
  expect(autoScrollDelta(port, { x: 200, y: 120 })).toEqual({ x: 0, y: -12 });

  // Near bottom edge inside viewport (y = 480, edge threshold = 40 => 500 - 40 = 460)
  expect(autoScrollDelta(port, { x: 200, y: 480 })).toEqual({ x: 0, y: 12 });

  // In middle of viewport -> no scrolling
  expect(autoScrollDelta(port, { x: 200, y: 300 })).toBeNull();
});
