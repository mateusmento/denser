<script setup lang="ts">
import { cn } from "@denser/design-system";
import { useEventListener, useMediaQuery } from "@vueuse/core";
import { computed, ref, useSlots } from "vue";

const props = defineProps<{
  /** Parent must set when using conditional #aside slots — useSlots() is not reactive. */
  asideOpen?: boolean;
}>();

const ASIDE_MIN_WIDTH = 280;
const ASIDE_MAX_WIDTH = 520;
const ASIDE_DEFAULT_WIDTH = 352;

const slots = useSlots();
const asideOpen = computed(() => props.asideOpen ?? Boolean(slots.aside));
const isDesktop = useMediaQuery("(min-width: 640px)");
const showSplit = computed(() => asideOpen.value && isDesktop.value);
const showMobileAside = computed(() => asideOpen.value && !isDesktop.value);

const asideWidth = ref(ASIDE_DEFAULT_WIDTH);
const resizing = ref(false);
const dragStartX = ref(0);
const dragStartWidth = ref(0);

function onResizePointerDown(event: PointerEvent) {
  if (!showSplit.value) return;
  resizing.value = true;
  dragStartX.value = event.clientX;
  dragStartWidth.value = asideWidth.value;
}

useEventListener(window, "pointermove", (moveEvent) => {
  if (!resizing.value) return;
  const delta = dragStartX.value - moveEvent.clientX;
  asideWidth.value = Math.min(
    ASIDE_MAX_WIDTH,
    Math.max(ASIDE_MIN_WIDTH, dragStartWidth.value + delta),
  );
});

useEventListener(window, "pointerup", () => {
  resizing.value = false;
});

useEventListener(document, "selectstart", (event) => {
  if (resizing.value) event.preventDefault();
});
</script>

<template>
  <div
    class="relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden p-3 gap-3"
    data-slot="conversation-surface"
  >
    <section
      v-show="!showMobileAside"
      class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label="Conversation"
      data-slot="conversation-column"
    >
      <div
        :class="
          cn(
            'flex min-h-surface-header shrink-0 items-center border-b border-border pb-2',
            !showSplit && '-mx-3',
          )
        "
      >
        <slot name="header" />
      </div>
      <div
        :class="cn('relative min-h-0 flex-1', !showSplit && '-mx-3')"
      >
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
        class="relative z-0 box-border flex max-h-96 shrink-0 basis-surface-footer flex-col"
        data-slot="conversation-footer"
      >
        <slot name="composer" />
      </div>
    </section>

    <template v-if="asideOpen">
      <div
        v-if="showSplit"
        class="group relative w-2 shrink-0 cursor-col-resize touch-none self-stretch"
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
            showMobileAside
              ? 'absolute inset-3 z-10 min-w-0 rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-black/5 animate-in duration-300 fade-in dark:ring-white/10'
              : 'max-w-none shrink-0 self-stretch animate-in duration-300 fade-in slide-in-from-right-4',
            !showMobileAside &&
              'rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10',
          )
        "
        :style="showSplit ? { width: `${asideWidth}px` } : undefined"
        aria-label="Side panel"
        data-slot="conversation-aside"
      >
        <slot name="aside" />
      </aside>
    </template>
  </div>
</template>
