<script setup lang="ts">
import { cn } from "@denser/design-system";
</script>

<template>
  <div class="relative flex min-h-0 min-w-0 flex-1 gap-3 p-3" data-slot="conversation-surface">
    <section
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

    <aside
      v-if="$slots.thread"
      :class="
        cn(
          'flex w-full max-w-md flex-col overflow-hidden rounded-2xl sm:w-[22rem]',
          'bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10',
        )
      "
      aria-label="Thread"
      data-slot="conversation-thread"
    >
      <slot name="thread" />
    </aside>
  </div>
</template>
