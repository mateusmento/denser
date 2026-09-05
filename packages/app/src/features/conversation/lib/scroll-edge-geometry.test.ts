import { describe, expect, it } from "vitest";
import {
  distanceFromEnd,
  isNearEnd,
  isNearStart,
  shouldAttemptEndLoad,
  shouldAttemptStartLoad,
  shouldRearmEnd,
  shouldRearmStart,
} from "./scroll-edge-geometry";

describe("scroll-edge-geometry", () => {
  it("computes distance from end", () => {
    expect(
      distanceFromEnd({ scrollTop: 100, scrollHeight: 500, clientHeight: 200 }),
    ).toBe(200);
  });

  it("detects near start / end", () => {
    expect(isNearStart(0, 48)).toBe(true);
    expect(isNearStart(49, 48)).toBe(false);
    expect(isNearEnd(40, 48)).toBe(true);
    expect(isNearEnd(49, 48)).toBe(false);
  });

  it("re-arms only after leaving the edge zone", () => {
    expect(shouldRearmStart(120, 120)).toBe(false);
    expect(shouldRearmStart(121, 120)).toBe(true);
    expect(shouldRearmEnd(160, 160)).toBe(false);
    expect(shouldRearmEnd(161, 160)).toBe(true);
  });

  it("attempts loads only when near the matching edge", () => {
    expect(
      shouldAttemptStartLoad(
        { scrollTop: 10, scrollHeight: 1000, clientHeight: 200 },
        48,
      ),
    ).toBe(true);
    expect(
      shouldAttemptEndLoad(
        { scrollTop: 700, scrollHeight: 900, clientHeight: 200 },
        48,
        false,
      ),
    ).toBe(true);
    expect(
      shouldAttemptEndLoad(
        { scrollTop: 300, scrollHeight: 900, clientHeight: 200 },
        48,
        false,
      ),
    ).toBe(false);
  });
});
