<script setup lang="ts">
import { cn } from '@denser/design-system';

</script>

<template>
  <div
    class="relative flex min-h-0 min-w-0 flex-1 gap-3 p-3"
    data-slot="conversation-surface"
  >
    <section
      class="flex min-w-0 flex-1 flex-col"
      aria-label="Conversation"
      data-slot="conversation-column"
    >
      <div class="flex min-h-surface-header shrink-0 items-center pb-2 -mx-3 border-b border-border">
        <slot name="header" />
      </div>
      <div class="relative min-h-0 flex-1 -mx-3">
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
        class="box-border z-3 flex basis-surface-footer shrink-0 flex-col max-h-96"
        data-slot="conversation-footer"
      >
        <slot name="composer" />
      </div>
    </section>

    <aside
      v-if="$slots.thread"
      :class="cn(
        'flex w-full max-w-md flex-col overflow-hidden rounded-2xl sm:w-[22rem]',
        'bg-card shadow-sm ring-1 ring-black/5 text-card-foreground dark:ring-white/10'
        )"
      aria-label="Thread"
      data-slot="conversation-thread"
    >
      <slot name="thread" />
    </aside>
  </div>
</template>
