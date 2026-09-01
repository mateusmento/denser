<script setup lang="ts">
import type { ArtifactId, ArtifactSummary } from "@denser/contracts";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  ScrollArea,
} from "@denser/design-system";
import { CheckIcon, SearchIcon } from "@lucide/vue";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  documents: readonly ArtifactSummary[];
  selectedIds: readonly ArtifactId[];
  allowMultiple?: boolean;
  excludeDocumentId?: ArtifactId | null;
  loading?: boolean;
  spaceTitle?: string;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  select: [documentId: ArtifactId];
  remove: [documentId: ArtifactId];
}>();

const search = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) search.value = "";
  },
);

const filteredDocuments = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return props.documents
    .filter((doc) => doc.id !== props.excludeDocumentId)
    .filter((doc) => !needle || doc.title.toLowerCase().includes(needle));
});

function isSelected(documentId: ArtifactId) {
  return props.selectedIds.includes(documentId);
}

function onToggle(event: Event, documentId: ArtifactId) {
  event.preventDefault();
  if (isSelected(documentId)) {
    emit("remove", documentId);
    return;
  }
  emit("select", documentId);
  if (!props.allowMultiple) {
    emit("update:open", false);
  }
}
</script>

<template>
  <DropdownMenuContent align="start" class="w-56 overflow-hidden">
    <label class="mx-1 flex items-center gap-2 px-2">
      <SearchIcon class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        v-model="search"
        type="search"
        placeholder="Link or create a page..."
        aria-label="Search documents"
        class="h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        @keydown.stop
        @pointerdown.stop
      />
    </label>
    <DropdownMenuSeparator />
    <ScrollArea class="h-56">
      <DropdownMenuLabel v-if="spaceTitle" class="text-xs font-medium text-muted-foreground">
        {{ spaceTitle }}
      </DropdownMenuLabel>
      <p v-if="loading" class="px-3 py-1.5 text-xs text-muted-foreground">Loading…</p>
      <template v-else>
        <DropdownMenuItem
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="flex items-center justify-between text-xs"
          @select="onToggle($event, doc.id)"
        >
          <span class="min-w-0 flex-1 truncate">{{ doc.title || "Untitled" }}</span>
          <CheckIcon v-if="isSelected(doc.id)" class="size-3.5 shrink-0 text-primary" />
        </DropdownMenuItem>
        <p
          v-if="!filteredDocuments.length"
          class="px-3 py-1.5 text-xs text-muted-foreground"
        >
          No documents
        </p>
      </template>
    </ScrollArea>
  </DropdownMenuContent>
</template>
