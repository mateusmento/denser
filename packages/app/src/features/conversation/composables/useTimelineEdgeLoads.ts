import { useMessageScrollerContextMaybe } from "@denser/design-system";
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import type { NextPageState, PreviousPageState } from "@/lib/async";
import {
  distanceFromEnd,
  shouldAttemptEndLoad,
  shouldAttemptStartLoad,
  shouldRearmEnd,
  shouldRearmStart,
} from "../lib/scroll-edge-geometry";

const NEAR_PX = 48;
const LEAVE_PX = 120;

export function useTimelineEdgeLoads(options: {
  previousPage: Ref<PreviousPageState>;
  nextPage: Ref<NextPageState>;
  onLoadPrevious: () => void;
  onLoadNext: () => void;
  resetKey?: Ref<unknown>;
}) {
  const ctx = useMessageScrollerContextMaybe();
  const startArmed = ref(true);
  const endArmed = ref(true);

  function tryEdgeLoads() {
    const el = ctx?.viewportElement.value;
    if (!el || ctx?.autoscrolling.value) return;

    const metrics = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
    const dist = distanceFromEnd(metrics);

    if (shouldRearmStart(el.scrollTop, LEAVE_PX)) startArmed.value = true;
    if (shouldRearmEnd(dist, LEAVE_PX)) endArmed.value = true;

    if (
      startArmed.value &&
      shouldAttemptStartLoad(metrics, NEAR_PX) &&
      options.previousPage.value.hasPrevious &&
      !options.previousPage.value.loadingPrevious
    ) {
      startArmed.value = false;
      options.onLoadPrevious();
    }

    if (
      endArmed.value &&
      shouldAttemptEndLoad(metrics, NEAR_PX, false) &&
      options.nextPage.value.hasNext &&
      !options.nextPage.value.loadingNext
    ) {
      endArmed.value = false;
      options.onLoadNext();
    }
  }

  function onScroll() {
    tryEdgeLoads();
  }

  let boundEl: HTMLElement | null = null;

  function bind(el: HTMLElement | null) {
    if (boundEl === el) return;
    boundEl?.removeEventListener("scroll", onScroll);
    boundEl = el;
    el?.addEventListener("scroll", onScroll, { passive: true });
  }

  watch(
    () => ctx?.viewportElement.value ?? null,
    (el) => bind(el),
    { immediate: true },
  );

  if (options.resetKey) {
    watch(options.resetKey, () => {
      startArmed.value = true;
      endArmed.value = true;
    });
  }

  onBeforeUnmount(() => bind(null));

  return { tryEdgeLoads, nearPx: NEAR_PX };
}
