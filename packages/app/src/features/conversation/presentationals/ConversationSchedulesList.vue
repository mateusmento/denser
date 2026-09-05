<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  Spinner,
} from "@denser/design-system";
import { EllipsisIcon, PencilIcon, Trash2Icon } from "@lucide/vue";
import { RichTextPreview } from "@/modules/rich-text";
import type { ScheduledMessageView } from "../types";
import MessageAttachmentList from "./MessageAttachmentList.vue";

defineProps<{
  schedules: readonly ScheduledMessageView[];
  loading?: boolean;
  errorLabel?: string;
}>();

const emit = defineEmits<{
  edit: [id: string];
  cancel: [id: string];
}>();
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col" data-slot="conversation-schedules-list">
    <div v-if="loading" class="flex flex-1 items-center justify-center p-6">
      <Spinner class="size-6 text-muted-foreground" />
    </div>
    <p v-else-if="errorLabel" class="p-4 text-sm text-destructive">{{ errorLabel }}</p>
    <ScrollArea v-else class="h-full min-h-0">
      <ul class="flex flex-col gap-2 p-3">
        <li
          v-for="item in schedules"
          :key="item.id"
          class="rounded-xl border border-border/80 bg-card/40 p-3 text-sm shadow-xs"
        >
          <div class="flex items-start gap-2">
            <div class="min-w-0 flex-1 space-y-2">
              <RichTextPreview :doc="item.body" class="text-foreground/90" />
              <MessageAttachmentList
                v-if="item.attachments.length"
                :attachments="item.attachments"
              />
              <p class="text-xs text-muted-foreground">
                Sends {{ item.dueAtLabel }}
                <span v-if="item.threadId" class="text-muted-foreground/80"> · thread reply</span>
              </p>
            </div>
            <DropdownMenu v-if="item.isMine">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon-sm" aria-label="Scheduled message actions">
                  <EllipsisIcon class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @select="emit('edit', item.id)">
                  <PencilIcon class="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @select="emit('cancel', item.id)">
                  <Trash2Icon class="size-3.5" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
        <li
          v-if="!schedules.length"
          class="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground"
        >
          No scheduled messages yet. Use the clock icon in the composer to schedule a send.
        </li>
      </ul>
    </ScrollArea>
  </div>
</template>
