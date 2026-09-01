<script setup lang="ts">
import type { ArtifactId, RelationPropertyDefinition } from "@denser/contracts";
import { Badge, DropdownMenu, DropdownMenuTrigger } from "@denser/design-system";
import { PlusIcon, XIcon } from "@lucide/vue";
import RelationDocumentPickerMenu from "./RelationDocumentPickerMenu.vue";
import type { RelationDocumentsEntry } from "../types";
import { relationDocumentTitle } from "../lib/document-properties-view";

const props = defineProps<{
  prop: RelationPropertyDefinition;
  value: unknown;
  editable: boolean;
  open: boolean;
  currentDocumentId?: ArtifactId | null;
  relationEntry?: RelationDocumentsEntry;
  spaceTitle?: string;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  loadDocuments: [];
  select: [documentId: ArtifactId];
  remove: [documentId: ArtifactId];
}>();

function relationIds(): ArtifactId[] {
  const raw = props.value;
  if (Array.isArray(raw)) return raw as ArtifactId[];
  if (typeof raw === "string" && raw) return [raw as ArtifactId];
  return [];
}

function onOpenChange(open: boolean) {
  emit("update:open", open);
  if (open) emit("loadDocuments");
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <Badge
      v-for="documentId in relationIds()"
      :key="documentId"
      variant="secondary"
      class="h-5 gap-1 py-0 text-xs"
    >
      <span>{{
        relationDocumentTitle(relationEntry?.items ?? [], documentId)
      }}</span>
      <button
        v-if="editable"
        type="button"
        class="rounded-full p-0.5 hover:bg-muted-foreground/20"
        @click="emit('remove', documentId)"
      >
        <XIcon class="size-2.5" />
      </button>
    </Badge>

    <DropdownMenu
      v-if="editable && prop.relationSpaceId"
      :open="open"
      @update:open="onOpenChange"
    >
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PlusIcon class="size-3" />
          {{ relationIds().length ? "Add" : "Empty" }}
        </button>
      </DropdownMenuTrigger>
      <RelationDocumentPickerMenu
        :open="open"
        :documents="relationEntry?.items ?? []"
        :selected-ids="relationIds()"
        :allow-multiple="prop.allowMultiple !== false"
        :exclude-document-id="currentDocumentId"
        :loading="relationEntry?.loading ?? false"
        :space-title="spaceTitle"
        @update:open="onOpenChange"
        @select="emit('select', $event)"
        @remove="emit('remove', $event)"
      />
    </DropdownMenu>

    <span v-else-if="!editable && !relationIds().length" class="text-xs text-muted-foreground">
      Empty
    </span>
  </div>
</template>
