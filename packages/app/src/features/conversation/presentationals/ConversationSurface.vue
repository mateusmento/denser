<script setup lang="ts">
import { cn } from "@denser/design-system";
import { useEventListener, useMediaQuery } from "@vueuse/core";
import { computed, ref, useSlots } from "vue";

const THREAD_MIN_WIDTH = 280;
const THREAD_MAX_WIDTH = 520;
const THREAD_DEFAULT_WIDTH = 352;

const slots = useSlots();
const threadOpen = computed(() => Boolean(slots.thread));
const isDesktop = useMediaQuery("(min-width: 640px)");
const showSplit = computed(() => threadOpen.value && isDesktop.value);
const showMobileThread = computed(() => threadOpen.value && !isDesktop.value);

const threadWidth = ref(THREAD_DEFAULT_WIDTH);
const resizing = ref(false);

function onResizePointerDown(event: PointerEvent) {
  if (!showSplit.value) return;
  resizing.value = true;
  const startX = event.clientX;
  const startWidth = threadWidth.value;

  function onMove(moveEvent: PointerEvent) {
    const delta = startX - moveEvent.clientX;
    threadWidth.value = Math.min(
      THREAD_MAX_WIDTH,
      Math.max(THREAD_MIN_WIDTH, startWidth + delta),
    );
  }

  function onUp() {
    resizing.value = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

useEventListener(document, "selectstart", (event) => {
  if (resizing.value) event.preventDefault();
});
</script>

<template>
  <div
    class="relative flex min-h-0 min-w-0 flex-1 p-3"
    :class="showSplit ? 'gap-0' : 'gap-3'"
    data-slot="conversation-surface"
  >
    <section
      v-show="!showMobileThread"
      class="flex min-w-0 flex-1 flex-col"
      aria-label="Conversation"
      data-slot="conversation-column"
    >
      <div
        class="-mx-3 flex min-h-surface-header shrink-0 items-center border-b border-border pb-2"
      >
        <slot name="header" />
      </div>
      <div class="relative -mx-3 min-h-0 flex-1">
        <div
          class="pointer-events-none absolute inset-x-px top-0 z-2 h-5 bg-linear-to-b from-background via-35% to-transparent"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute inset-x-px bottom-0 z-2 h-10 bg-linear-to-t from-background via-background/50 via-35% to-transparent"
          aria-hidden="true"
        />
        <div class="relative z-0 size-full min-h-0">
          <slot name="messages" />
        </div>
      </div>
      <div
        class="z-3 box-border flex max-h-96 shrink-0 basis-surface-footer flex-col"
        data-slot="conversation-footer"
      >
        <slot name="composer" />
      </div>
    </section>

    <template v-if="threadOpen">
      <div
        v-if="showSplit"
        class="group relative z-1 -mx-1 w-2 shrink-0 cursor-col-resize touch-none"
        aria-hidden="true"
        @pointerdown="onResizePointerDown"
      >
        <div
          class="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-foreground/25 group-active:bg-foreground/35"
        />
      </div>

      <aside
        :class="
          cn(
            'flex min-h-0 flex-col overflow-hidden',
            showMobileThread
              ? 'absolute inset-3 z-10 min-w-0 rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-black/5 animate-in duration-300 fade-in dark:ring-white/10'
              : 'max-w-none shrink-0 animate-in duration-300 fade-in slide-in-from-right-4',
            !showMobileThread &&
              'rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10',
          )
        "
        :style="showSplit ? { width: `${threadWidth}px` } : undefined"
        aria-label="Thread"
        data-slot="conversation-thread"
      >
        <slot name="thread" />
      </aside>
    </template>
  </div>
</template>
