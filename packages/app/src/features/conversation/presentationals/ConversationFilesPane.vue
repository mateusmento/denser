<script setup lang="ts">
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@denser/design-system";
import { FileIcon, Trash2Icon } from "@lucide/vue";
import type { ConversationFilesPaneView } from "../types";

defineProps<{
  view: ConversationFilesPaneView;
  deletingId?: string | null;
}>();

const open = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
  retry: [];
  delete: [fileId: string];
}>();
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="flex w-full flex-col sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Files</SheetTitle>
        <SheetDescription>Files shared in this conversation.</SheetDescription>
      </SheetHeader>

      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-4">
        <template v-if="view.state === 'loading'">
          <Skeleton v-for="index in 4" :key="index" class="h-14 w-full rounded-lg" />
        </template>

        <template v-else-if="view.state === 'error'">
          <p class="text-sm text-destructive">{{ view.errorMessage }}</p>
          <Button variant="outline" size="sm" class="w-fit" @click="emit('retry')">Retry</Button>
        </template>

        <p
          v-else-if="!view.files.length"
          class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
        >
          No files shared yet.
        </p>

        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="file in view.files"
            :key="file.id"
            class="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
          >
            <a
              :href="file.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex min-w-0 flex-1 items-start gap-3 no-underline"
            >
              <span class="mt-0.5 text-muted-foreground">
                <FileIcon class="size-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-foreground">{{ file.name }}</span>
                <span class="block text-xs text-muted-foreground">
                  {{ file.uploaderName }} · {{ file.createdAtLabel }} · {{ file.byteSizeLabel }}
                </span>
              </span>
            </a>
            <Button
              v-if="file.canDelete"
              variant="ghost"
              size="icon"
              class="shrink-0 text-muted-foreground hover:text-destructive"
              :disabled="deletingId === file.id"
              :aria-label="`Delete ${file.name}`"
              @click="emit('delete', file.id)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </li>
        </ul>
      </div>
    </SheetContent>
  </Sheet>
</template>
