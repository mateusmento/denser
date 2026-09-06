<script setup lang="ts">
import { cn } from "@denser/design-system";
import type { ConversationPollView } from "../types";

const props = defineProps<{
  poll: ConversationPollView;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  vote: [optionId: string];
}>();

function percent(count: number): number {
  if (props.poll.totalVotes === 0) return 0;
  return Math.round((count / props.poll.totalVotes) * 100);
}
</script>

<template>
  <div
    data-slot="message-poll-embed"
    class="flex w-full min-w-[min(100%,16rem)] max-w-md flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
  >
    <p class="text-sm font-medium text-foreground">{{ poll.question }}</p>
    <ul class="flex flex-col gap-1.5" role="list">
      <li v-for="option in poll.options" :key="option.id">
        <button
          type="button"
          class="relative w-full overflow-hidden rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-60"
          :disabled="disabled"
          :aria-pressed="poll.votedOptionId === option.id"
          @click="emit('vote', option.id)"
        >
          <span
            v-if="poll.totalVotes > 0"
            class="pointer-events-none absolute inset-y-0 left-0 bg-primary/15"
            :style="{ width: `${percent(option.voteCount)}%` }"
          />
          <span class="relative flex items-center justify-between gap-2">
            <span :class="cn(poll.votedOptionId === option.id && 'font-medium')">{{ option.label }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ option.voteCount }}{{ poll.totalVotes > 0 ? ` · ${percent(option.voteCount)}%` : "" }}
            </span>
          </span>
        </button>
      </li>
    </ul>
    <p class="text-xs text-muted-foreground">{{ poll.totalVotes }} {{ poll.totalVotes === 1 ? "vote" : "votes" }}</p>
  </div>
</template>
