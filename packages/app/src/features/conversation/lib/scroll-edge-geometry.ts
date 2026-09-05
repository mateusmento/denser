/** Scroll metrics used by timeline edge near/leave predicates. */
export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export function distanceFromEnd(el: ScrollMetrics): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

export function isNearStart(scrollTop: number, nearPx: number): boolean {
  return scrollTop <= nearPx;
}

export function isNearEnd(distFromEnd: number, nearPx: number): boolean {
  return distFromEnd <= nearPx;
}

export function shouldRearmStart(scrollTop: number, leavePx: number): boolean {
  return scrollTop > leavePx;
}

export function shouldRearmEnd(distFromEnd: number, leavePx: number): boolean {
  return distFromEnd > leavePx;
}

export function shouldAttemptStartLoad(el: ScrollMetrics, nearPx: number): boolean {
  return isNearStart(el.scrollTop, nearPx);
}

export function shouldAttemptEndLoad(
  el: ScrollMetrics,
  nearPx: number,
  fillWhenUnfilled: boolean,
): boolean {
  const dist = distanceFromEnd(el);
  if (isNearEnd(dist, nearPx)) return true;
  return fillWhenUnfilled && el.scrollHeight <= el.clientHeight + 1;
}
