<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMessageScrollerContextMaybe } from "@denser/design-system";
import { autoUpdate, computePosition, offset, shift } from "@floating-ui/dom";
import { SmileIcon, MessageSquareIcon, PencilIcon, TrashIcon } from "@lucide/vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import type { ConversationMessageView } from "../types";

const props = defineProps<{
  message: ConversationMessageView;
  threadActions: boolean;
  /** Optional override; inside a MessageScroller the scroll viewport from context is used. */
  collisionBoundary?: HTMLElement | (HTMLElement | null)[] | null;
}>();

const emit = defineEmits<{
  react: [emoji: string];
  thread: [];
  edit: [];
  delete: [];
}>();

const OPEN_DELAY_MS = 200;
const CLOSE_DELAY_MS = 200;
/** Gap between bubble and right-outside menu. */
const SIDE_GAP = 10;
/**
 * Top-right (inset) mode anchors the *bottom* of the card to the bubble’s top edge,
 * then applies INSET_TOP (negative = above the bubble, e.g. -24).
 * INSET_RIGHT is the gap from the bubble’s right edge to the card’s right edge.
 */
const INSET_TOP = 8;
const INSET_RIGHT = 24;
const EDGE_PADDING = 8;
const FALLBACK_MENU_WIDTH = 140;

const open = ref(false);
/**
 * Chosen from available row width (bubble + menu vs scroller).
 * Re-resolved on layout/resize while open (e.g. thread pane), not driven by scroll shift.
 * - `right` — outside the bubble when the row has room; shifts/sticks at the scroller edge
 * - `inset` — top-right of the bubble (bottom of card anchored to bubble top); fixed relative to the bubble
 */
const placement = ref<"right" | "inset">("right");
const floatingStyle = ref<Record<string, string>>({
  position: "fixed",
  top: "0px",
  left: "0px",
  width: "max-content",
});

const hostRef = useTemplateRef<HTMLElement>("host");
const menuRef = useTemplateRef<HTMLElement>("menu");
const scroller = useMessageScrollerContextMaybe();

const isInset = computed(() => placement.value === "inset");

const boundaryEl = computed(
  () =>
    resolveBoundary(props.collisionBoundary) ??
    scroller?.viewportElement.value ??
    null,
);

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let stopAutoUpdate: (() => void) | undefined;

useEventListener(
  boundaryEl,
  "scroll",
  () => {
    if (!open.value) return;
    void syncPosition();
  },
  { passive: true },
);

// Thread pane / column reflow shrinks the scroller — re-check right vs inset.
useResizeObserver(boundaryEl, () => {
  if (!open.value) return;
  void syncPosition();
});

watch(open, async (isOpen) => {
  stopAutoUpdate?.();
  stopAutoUpdate = undefined;
  if (!isOpen) return;

  if (!canShowHoverMenu()) {
    open.value = false;
    return;
  }

  await nextTick();
  const host = hostRef.value;
  const menu = menuRef.value;
  if (!host || !menu) return;

  // autoUpdate also fires on element/ancestor resize (thread pane, bubble reflow).
  stopAutoUpdate = autoUpdate(host, menu, () => {
    void syncPosition();
  });
});

onBeforeUnmount(() => {
  clearTimers();
  stopAutoUpdate?.();
});

function resolveBoundary(
  boundary: HTMLElement | (HTMLElement | null)[] | null | undefined,
): HTMLElement | null {
  if (!boundary) return null;
  if (boundary instanceof HTMLElement) return boundary;
  return boundary.find((el): el is HTMLElement => el instanceof HTMLElement) ?? null;
}

function clearTimers() {
  if (openTimer !== undefined) clearTimeout(openTimer);
  if (closeTimer !== undefined) clearTimeout(closeTimer);
  openTimer = undefined;
  closeTimer = undefined;
}

function scheduleOpen() {
  clearTimers();
  openTimer = setTimeout(() => {
    placement.value = resolvePlacement();
    if (!canShowHoverMenu()) return;
    open.value = true;
  }, OPEN_DELAY_MS);
}

/** Re-check right vs inset from current widths, then reposition (and dismiss if needed). */
async function syncPosition() {
  if (!open.value) return;
  const next = resolvePlacement();
  const modeChanged = next !== placement.value;
  placement.value = next;
  // Inset chrome changes menu size — wait a frame before measuring.
  if (modeChanged) await nextTick();
  await updatePosition();
  dismissIfNeeded();
}

function scheduleClose() {
  clearTimers();
  closeTimer = setTimeout(() => {
    open.value = false;
  }, CLOSE_DELAY_MS);
}

function onHostEnter() {
  clearTimers();
  if (!open.value) scheduleOpen();
}

function onHostLeave() {
  scheduleClose();
}

function onMenuEnter() {
  clearTimers();
}

function onMenuLeave() {
  scheduleClose();
}

/** True when bubble + right-outside menu cannot share one row in the scroller. */
function needsInsetPlacement(): boolean {
  const host = hostRef.value;
  if (!host) return false;

  const hostRect = host.getBoundingClientRect();
  const boundaryRect = boundaryEl.value?.getBoundingClientRect();
  const rowRight = boundaryRect?.right ?? window.innerWidth;
  const availableRowWidth = rowRight - hostRect.left;
  const menuWidth = menuRef.value?.offsetWidth ?? FALLBACK_MENU_WIDTH;

  return hostRect.width + SIDE_GAP + menuWidth > availableRowWidth;
}

function resolvePlacement(): "right" | "inset" {
  return needsInsetPlacement() ? "inset" : "right";
}

function triggerInsideBoundary(): boolean {
  const boundary = boundaryEl.value;
  const host = hostRef.value;
  if (!host || !boundary) return true;

  const b = boundary.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  return h.bottom > b.top && h.top < b.bottom && h.right > b.left && h.left < b.right;
}

/**
 * Right mode: sticky menu has slid to (or past) the bubble's bottom —
 * or top when stuck at the scroller bottom.
 */
function menuPastBubbleEdge(): boolean {
  const host = hostRef.value;
  const menu = menuRef.value;
  if (!host || !menu) return false;

  const h = host.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  if (m.width === 0 && m.height === 0) return false;
  return m.top >= h.bottom - 1 || m.bottom <= h.top + 1;
}

function canShowHoverMenu(): boolean {
  return triggerInsideBoundary();
}

function shouldDismissHoverMenu(): boolean {
  if (!triggerInsideBoundary()) return true;
  // Inset is clamped inside the scroller in updatePosition — only dismiss when the bubble leaves.
  if (isInset.value) return false;
  return menuPastBubbleEdge();
}

function dismissIfNeeded() {
  if (!open.value) return;
  if (shouldDismissHoverMenu()) open.value = false;
}

async function updatePosition() {
  const host = hostRef.value;
  const menu = menuRef.value;
  if (!host || !menu || !open.value) return;

  if (isInset.value) {
    // Prefer above the bubble; clamp into the scroller so top-of-thread parents keep a menu.
    const h = host.getBoundingClientRect();
    const b = boundaryEl.value?.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;

    let top = h.top + INSET_TOP - mh;
    let left = h.right - mw - INSET_RIGHT;

    if (b) {
      const minTop = b.top + EDGE_PADDING;
      const maxTop = b.bottom - EDGE_PADDING - mh;
      if (top < minTop) {
        // Not enough room above — sit just below the bubble’s top edge instead.
        top = Math.min(h.top + INSET_TOP, maxTop);
      }
      top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));
      left = Math.min(Math.max(left, b.left + EDGE_PADDING), b.right - EDGE_PADDING - mw);
    }

    floatingStyle.value = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: "max-content",
    };
    return;
  }

  // Right-outside: shift vertically so the menu sticks to the scroller edge
  // and rolls over the bubble until it meets the bubble's end.
  const boundary = boundaryEl.value ?? undefined;
  const { x, y } = await computePosition(host, menu, {
    placement: "right-start",
    strategy: "fixed",
    middleware: [
      offset(SIDE_GAP),
      shift({
        padding: EDGE_PADDING,
        boundary,
        altBoundary: Boolean(boundary),
        crossAxis: true,
      }),
    ],
  });

  floatingStyle.value = {
    position: "fixed",
    top: `${y}px`,
    left: `${x}px`,
    width: "max-content",
  };
}
</script>

<template>
  <div
    ref="host"
    class="w-fit max-w-full min-w-0"
    @pointerenter="onHostEnter"
    @pointerleave="onHostLeave"
  >
    <!-- `highlighted` tracks menu open so BubbleContent can keep hover paint while the pointer is on the teleported toolbar -->
    <slot :highlighted="open" />

    <Teleport to="body">
      <div
        v-if="open"
        ref="menu"
        role="toolbar"
        aria-label="Message actions"
        data-slot="message-hover-menu"
        :style="floatingStyle"
        :class="cn(
          'z-50 flex w-fit gap-1 **:[button]:rounded-lg',
          'rounded-xl border border-border bg-secondary p-0.5 text-secondary-foreground',
          'shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10',
        )"
        @pointerenter="onMenuEnter"
        @pointerleave="onMenuLeave"
      >
        <Button size="icon-sm" variant="ghost" aria-label="Add reaction" @click="emit('react', '👍')">
          <SmileIcon class="size-3.5" />
        </Button>
        <Button
          v-if="threadActions"
          size="icon-sm"
          variant="ghost"
          aria-label="Reply in thread"
          @click="emit('thread')"
        >
          <MessageSquareIcon class="size-3.5" />
        </Button>
        <Button
          v-if="message.canEdit"
          size="icon-sm"
          variant="ghost"
          aria-label="Edit"
          @click="emit('edit')"
        >
          <PencilIcon class="size-3.5" />
        </Button>
        <Button
          v-if="message.canDelete"
          size="icon-sm"
          variant="ghost"
          aria-label="Delete"
          @click="emit('delete')"
        >
          <TrashIcon class="size-3.5" />
        </Button>
      </div>
    </Teleport>
  </div>
</template>
