<script setup lang="ts">
import { artifactDisplayTitle } from "@/features/document/lib/document-content";
import type { SpaceGalleryArtifactAction } from "@/modules/spaces/types";
import type { ArtifactKind } from "@denser/contracts";
import {
  Card,
  CardContent,
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@denser/design-system";
import { FileTextIcon, MessageCircleIcon } from "@lucide/vue";
import { computed } from "vue";

const props = defineProps<{
  title: string;
  kind: ArtifactKind;
  preview?: boolean;
  selected?: boolean;
}>();

const displayTitle = computed(() => artifactDisplayTitle(props.title));

const tileIcon = computed(() =>
  props.kind === "conversation" ? MessageCircleIcon : FileTextIcon,
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
  <button
    v-if="preview"
    type="button"
    tabindex="-1"
    data-slot="space-artifact-tile"
    :class="cn('group h-full w-full rounded-xl text-left')"
  >
    <Card size="sm" class="h-full w-full rounded-xl border-border">
      <CardContent class="flex h-full flex-col text-muted-foreground">
        <div class="flex flex-1 items-center justify-center">
          <component :is="tileIcon" class="size-6" aria-hidden="true" />
        </div>
        <p class="truncate text-sm font-medium">{{ displayTitle }}</p>
      </CardContent>
    </Card>
  </button>

  <ContextMenu v-else>
    <ContextMenuTrigger as-child>
      <button
        type="button"
        data-slot="space-artifact-tile"
        :aria-selected="selected || undefined"
        :data-selected="selected || undefined"
        :class="
          cn(
            'group w-full rounded-xl text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )
        "
        @click="emit('open')"
      >
        <Card
          size="sm"
          :class="
            cn(
              'aspect-square w-full border-border transition-colors rounded-xl cursor-pointer',
              'group-hover:bg-secondary/80 group-focus-visible:bg-card/80',
              selected && 'ring-2 ring-primary bg-primary/10 border-primary/50 text-foreground',
            )
          "
        >
          <CardContent
            :class="
              cn(
                'flex h-full flex-col text-muted-foreground group-hover:text-secondary-foreground',
                selected && 'text-foreground',
              )
            "
          >
            <div class="flex flex-1 items-center justify-center">
              <component :is="tileIcon" class="size-6" aria-hidden="true" />
            </div>
            <p class="truncate text-sm font-medium">{{ displayTitle }}</p>
          </CardContent>
        </Card>
      </button>
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @select="onAction('open')">Open</ContextMenuItem>
      <ContextMenuItem @select="onAction('rename')">Rename</ContextMenuItem>
      <ContextMenuSub v-if="$slots['move-to']">
        <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
        <ContextMenuSubContent class="min-w-56 p-0">
          <slot name="move-to" />
        </ContextMenuSubContent>
      </ContextMenuSub>
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
