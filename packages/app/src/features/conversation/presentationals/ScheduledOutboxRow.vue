<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@denser/design-system";
import { ClockIcon, EllipsisIcon, SquarePenIcon, Trash2Icon } from "@lucide/vue";
import type { ScheduledOutboxRowView } from "../types";
import { formatScheduledOutboxHeadline } from "../lib/outbox-preview";

defineProps<{
  item: ScheduledOutboxRowView;
}>();

const emit = defineEmits<{
  open: [id: string];
  editMessage: [id: string];
  reschedule: [id: string];
  cancel: [id: string];
}>();
</script>

<template>
  <article
    class="flex items-start gap-2 rounded-xl border border-border/80 bg-card/40 px-3 py-2 text-sm shadow-xs"
    data-slot="scheduled-outbox-row"
  >
    <button
      type="button"
      class="min-w-0 flex-1 text-left"
      @click="emit('open', item.id)"
    >
      <p class="truncate text-xs text-muted-foreground">
        {{
          formatScheduledOutboxHeadline({
            nextRunWallTimeLabel: item.nextRunWallTimeLabel,
            conversationLabel: item.conversationLabel,
            contextLabel: item.contextLabel,
            recurrenceLabel: item.recurrenceLabel,
          })
        }}
      </p>
      <p class="line-clamp-2 text-sm text-foreground">{{ item.bodyPreview }}</p>
    </button>

    <div class="flex shrink-0 items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit scheduled message"
        @click.stop="emit('editMessage', item.id)"
      >
        <SquarePenIcon class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Reschedule"
        @click.stop="emit('reschedule', item.id)"
      >
        <ClockIcon class="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm" aria-label="Scheduled message actions">
            <EllipsisIcon class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" @select="emit('cancel', item.id)">
            <Trash2Icon class="size-3.5" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </article>
</template>
