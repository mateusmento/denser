<script setup lang="ts">
import {
  Button,
  ScrollArea,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@denser/design-system";
import { XIcon } from "@lucide/vue";
import type { DraftOutboxRowView, DraftsScheduledPanelTab, ScheduledOutboxRowView } from "../types";
import DraftOutboxRow from "./DraftOutboxRow.vue";
import ScheduledOutboxRow from "./ScheduledOutboxRow.vue";

defineProps<{
  drafts: readonly DraftOutboxRowView[];
  scheduled: readonly ScheduledOutboxRowView[];
  draftsLoading?: boolean;
  scheduledLoading?: boolean;
  draftsErrorLabel?: string;
  scheduledErrorLabel?: string;
}>();

const tabModel = defineModel<DraftsScheduledPanelTab>("tab", { required: true });

const emit = defineEmits<{
  close: [];
  openDraft: [id: string];
  openScheduled: [id: string];
  editScheduledMessage: [id: string];
  rescheduleScheduled: [id: string];
  cancelScheduled: [id: string];
}>();
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col" data-slot="drafts-scheduled-panel">
    <header class="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
      <h2 class="min-w-0 flex-1 truncate text-sm font-semibold">Drafts &amp; scheduled</h2>
      <Button variant="ghost" size="icon-sm" aria-label="Close panel" @click="emit('close')">
        <XIcon class="size-4" />
      </Button>
    </header>

    <Tabs v-model="tabModel" class="flex min-h-0 flex-1 flex-col">
      <TabsList variant="line" class="h-9 shrink-0 justify-start bg-transparent px-3">
        <TabsTrigger value="drafts" class="px-3">Drafts</TabsTrigger>
        <TabsTrigger value="scheduled" class="px-3">Scheduled</TabsTrigger>
      </TabsList>

      <TabsContent value="drafts" class="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
        <div v-if="draftsLoading" class="flex flex-1 items-center justify-center p-6">
          <Spinner class="size-6 text-muted-foreground" />
        </div>
        <p v-else-if="draftsErrorLabel" class="p-4 text-sm text-destructive">
          {{ draftsErrorLabel }}
        </p>
        <ScrollArea v-else class="h-full min-h-0">
          <ul class="flex flex-col gap-2 p-3">
            <li v-for="item in drafts" :key="item.id">
              <DraftOutboxRow :item="item" @open="emit('openDraft', $event)" />
            </li>
            <li
              v-if="!drafts.length"
              class="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground"
            >
              No drafts in this conversation.
            </li>
          </ul>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="scheduled" class="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
        <div v-if="scheduledLoading" class="flex flex-1 items-center justify-center p-6">
          <Spinner class="size-6 text-muted-foreground" />
        </div>
        <p v-else-if="scheduledErrorLabel" class="p-4 text-sm text-destructive">
          {{ scheduledErrorLabel }}
        </p>
        <ScrollArea v-else class="h-full min-h-0">
          <ul class="flex flex-col gap-2 p-3">
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
              No scheduled messages in this conversation.
            </li>
          </ul>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  </div>
</template>
