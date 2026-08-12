<script setup lang="ts"></script>

<template>
  <div
    class="relative flex min-h-0 min-w-0 flex-1 gap-3 bg-background p-3"
    data-slot="conversation-surface"
  >
    <section
      class="flex min-w-0 flex-1 flex-col"
      aria-label="Conversation"
      data-slot="conversation-column"
    >
      <div class="flex h-surface-header shrink-0 items-center">
        <slot name="header" />
      </div>
      <div class="relative min-h-0 flex-1">
        <slot name="messages" />
      </div>
      <div
        class="box-border flex h-surface-footer shrink-0 flex-col px-1 py-3 sm:px-2"
        data-slot="conversation-footer"
      >
        <slot name="composer" />
      </div>
    </section>

    <aside
      v-if="$slots.thread"
      class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-black/5 sm:w-[22rem] dark:ring-white/10"
      aria-label="Thread"
      data-slot="conversation-thread"
    >
      <slot name="thread" />
    </aside>
  </div>
</template>
