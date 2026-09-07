<script setup lang="ts">
import { ScrollArea, Spinner } from "@denser/design-system";
import type { DraftOutboxRowView, ScheduledOutboxRowView } from "../types";
import DraftOutboxRow from "../presentationals/DraftOutboxRow.vue";
import ScheduledOutboxRow from "../presentationals/ScheduledOutboxRow.vue";

defineProps<{
  kind: "drafts" | "scheduled";
  title: string;
  drafts: readonly DraftOutboxRowView[];
  scheduled: readonly ScheduledOutboxRowView[];
  loading?: boolean;
  errorLabel?: string;
}>();

const emit = defineEmits<{
  openDraft: [id: string];
  openScheduled: [id: string];
  editScheduledMessage: [id: string];
  rescheduleScheduled: [id: string];
  cancelScheduled: [id: string];
}>();
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col gap-4 p-6">
    <header>
      <h1 class="text-lg font-semibold">{{ title }}</h1>
      <p class="text-sm text-muted-foreground">
        {{
          kind === "drafts"
            ? "Your drafts across this workspace."
            : "Your pending scheduled messages across this workspace."
        }}
      </p>
    </header>

    <div v-if="loading" class="flex flex-1 items-center justify-center py-12">
      <Spinner class="size-6 text-muted-foreground" />
    </div>
    <p v-else-if="errorLabel" class="text-sm text-destructive">{{ errorLabel }}</p>
    <ScrollArea v-else class="min-h-0 flex-1">
      <ul v-if="kind === 'drafts'" class="flex flex-col gap-2">
        <li v-for="item in drafts" :key="item.id">
          <DraftOutboxRow :item="item" @open="emit('openDraft', $event)" />
        </li>
        <li
          v-if="!drafts.length"
          class="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground"
        >
          No drafts yet.
        </li>
      </ul>
      <ul v-else class="flex flex-col gap-2">
        <li v-for="item in scheduled" :key="item.id">
          <ScheduledOutboxRow
            :item="item"
            @open="emit('openScheduled', $event)"
            @edit-message="emit('editScheduledMessage', $event)"
            @reschedule="emit('rescheduleScheduled', $event)"
            @cancel="emit('cancelScheduled', $event)"
          />
        </li>
        <li
          v-if="!scheduled.length"
          class="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground"
        >
          No scheduled messages yet.
        </li>
      </ul>
    </ScrollArea>
  </div>
</template>
