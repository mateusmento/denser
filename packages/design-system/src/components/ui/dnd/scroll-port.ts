import type { DndPoint, DndScrollPort } from "./types";

export function createOverflowScrollPort(element: HTMLElement): DndScrollPort {
  const listeners = new Set<() => void>();
  const onScroll = () => {
    for (const listener of listeners) listener();
  };

  element.addEventListener("scroll", onScroll, { passive: true });

  return {
    get offset() {
      return { x: element.scrollLeft, y: element.scrollTop };
    },
    get viewportSize() {
      return { width: element.clientWidth, height: element.clientHeight };
    },
    get viewportRect() {
      const rect = element.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    },
    scrollBy(delta: DndPoint) {
      element.scrollBy(delta.x, delta.y);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    dispose() {
      element.removeEventListener("scroll", onScroll);
      listeners.clear();
    },
  };
}

export function autoScrollDelta(
  port: DndScrollPort,
  pointer: DndPoint,
  edge = 40,
  speed = 12,
): DndPoint | null {
  const viewport = port.viewportRect;
  let x = 0;
  let y = 0;
  if (pointer.x < viewport.x + edge) x = -speed;
  else if (pointer.x > viewport.x + viewport.width - edge) x = speed;
  if (pointer.y < viewport.y + edge) y = -speed;
  else if (pointer.y > viewport.y + viewport.height - edge) y = speed;
  if (x === 0 && y === 0) return null;
  return { x, y };
}
