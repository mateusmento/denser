<script setup lang="ts">
import type { ArtifactKind } from "@denser/contracts";
import {
  Card,
  CardContent,
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@denser/design-system";
import { FileTextIcon, MessageSquareIcon } from "@lucide/vue";
import { computed } from "vue";
import type { SpaceGalleryArtifactAction } from "@/modules/spaces/types";
import { artifactDisplayTitle } from "@/features/document/lib/document-content";

const props = defineProps<{
  title: string;
  kind: ArtifactKind;
}>();

const displayTitle = computed(() => artifactDisplayTitle(props.title));

const tileIcon = computed(() =>
  props.kind === "conversation" ? MessageSquareIcon : FileTextIcon,
);

const emit = defineEmits<{
  open: [];
  action: [action: SpaceGalleryArtifactAction];
}>();

function onAction(action: SpaceGalleryArtifactAction) {
  emit("action", action);
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <button
        type="button"
        data-slot="space-artifact-tile"
        :class="
          cn(
            'group w-full rounded-[min(var(--radius-4xl),24px)] text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )
        "
        @click="emit('open')"
      >
        <Card
          size="sm"
          :class="
            cn(
              'aspect-square w-full border-border transition-colors rounded-2xl cursor-pointer',
              'group-hover:bg-secondary/80 group-focus-visible:bg-card/80',
            )
          "
        >
          <CardContent class="flex h-full flex-col text-muted-foreground group-hover:text-secondary-foreground">
            <div class="flex flex-1 items-center justify-center">
              <component :is="tileIcon" class="size-9" aria-hidden="true" />
            </div>
            <p class="truncate text-sm font-medium">{{ displayTitle }}</p>
          </CardContent>
        </Card>
      </button>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @select="onAction('open')">Open</ContextMenuItem>
      <ContextMenuItem @select="onAction('rename')">Rename</ContextMenuItem>
      <template v-if="kind === 'document'">
        <ContextMenuSeparator />
        <ContextMenuItem @select="onAction('duplicate')">Duplicate</ContextMenuItem>
      </template>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" @select="onAction('delete')">
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
