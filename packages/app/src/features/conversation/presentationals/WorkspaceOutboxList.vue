<script setup lang="ts">
import { ScrollArea, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from "@denser/design-system";
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
      <h1 class="text-lg font-semibold">Drafts &amp; scheduled</h1>
      <p class="text-sm text-muted-foreground">
        Your drafts and scheduled messages across this workspace.
      </p>
    </header>

    <Tabs v-model="tabModel" class="flex min-h-0 flex-1 flex-col gap-3">
      <TabsList variant="line" class="h-9 w-fit shrink-0 justify-start bg-transparent">
        <TabsTrigger value="drafts" class="px-3">Drafts</TabsTrigger>
        <TabsTrigger value="scheduled" class="px-3">Scheduled</TabsTrigger>
      </TabsList>

      <TabsContent value="drafts" class="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
        <div v-if="draftsLoading" class="flex flex-1 items-center justify-center py-12">
          <Spinner class="size-6 text-muted-foreground" />
        </div>
        <p v-else-if="draftsErrorLabel" class="text-sm text-destructive">{{ draftsErrorLabel }}</p>
        <ScrollArea v-else class="min-h-0 flex-1">
          <ul class="flex flex-col gap-2">
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
        </ScrollArea>
      </TabsContent>

      <TabsContent value="scheduled" class="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
        <div v-if="scheduledLoading" class="flex flex-1 items-center justify-center py-12">
          <Spinner class="size-6 text-muted-foreground" />
        </div>
        <p v-else-if="scheduledErrorLabel" class="text-sm text-destructive">
          {{ scheduledErrorLabel }}
        </p>
        <ScrollArea v-else class="min-h-0 flex-1">
          <ul class="flex flex-col gap-2">
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
      </TabsContent>
    </Tabs>
  </div>
</template>
